from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import httpx
import asyncio
import re
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db, PentestSession, User
from app.routers.auth import get_current_user
from app.config import settings

router = APIRouter()

class BatchExecutionRequest(BaseModel):
    target: str
    tools: list[str]
    auto_mode: bool = False

progress_store = {}

@router.get("/available")
async def get_available_tools():
    from app.services.tools_service import tools_service
    return {
        "tools": tools_service.get_all_tools(),
        "categories": tools_service.get_categories(),
        "total": len(tools_service.get_all_tools())
    }

@router.post("/batch")
async def execute_batch(
    request: BatchExecutionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = PentestSession(
        user_id=current_user.id,
        target=request.target,
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    progress_store[session.id] = {
        "current_tool": 0,
        "total_tools": len(request.tools),
        "status": "starting"
    }
    
    background_tasks.add_task(
        execute_batch_background,
        tools=request.tools,
        target=request.target,
        session_id=session.id,
        user_id=current_user.id
    )
    
    return {"success": True, "session_id": session.id}

@router.get("/session/{session_id}")
async def get_session_status(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(PentestSession).filter(
        PentestSession.id == session_id,
        PentestSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    progress = progress_store.get(session_id, {})
    results = session.results_json or {}
    
    return {
        "id": session.id,
        "status": session.status,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
        "results": results,
        "formatted_findings": results.get("formatted_findings", []),
        "progress": progress
    }

@router.get("/history")
async def get_execution_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(PentestSession).filter(
        PentestSession.user_id == current_user.id
    ).order_by(PentestSession.started_at.desc()).limit(limit).all()
    
    return [
        {
            "id": s.id,
            "target": s.target,
            "status": s.status,
            "started_at": s.started_at,
            "completed_at": s.completed_at,
            "findings_count": len(s.results_json.get("formatted_findings", [])) if s.results_json else 0
        }
        for s in sessions
    ]

async def execute_batch_background(tools: list, target: str, session_id: int, user_id: int):
    from app.database import SessionLocal
    
    db = SessionLocal()
    all_findings = []
    tool_results = {}
    
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            for idx, tool_name in enumerate(tools):
                progress_store[session_id] = {
                    "current_tool": idx,
                    "total_tools": len(tools),
                    "current_tool_name": tool_name,
                    "status": f"Running {tool_name} ({idx+1}/{len(tools)})"
                }
                
                print(f"[{datetime.now()}] Running {tool_name} against {target}")
                
                try:
                    response = await client.post(
                        f"{settings.HEXSTRIKE_URL}/api/tools/{tool_name}",
                        json={"target": target},
                        timeout=180
                    )
                    
                    if response.status_code == 200:
                        raw_result = response.json()
                        tool_results[tool_name] = raw_result
                        
                        stdout = raw_result.get("stdout", "")
                        if not stdout:
                            stdout = str(raw_result)
                        
                        # Parse findings (without OpenAI to avoid internet dependency)
                        findings = parse_findings(tool_name, target, stdout)
                        
                        for finding in findings:
                            finding["tool"] = tool_name
                            all_findings.append(finding)
                        
                        print(f"  Found {len(findings)} findings from {tool_name}")
                        
                    else:
                        tool_results[tool_name] = {"error": f"HTTP {response.status_code}"}
                        
                except Exception as e:
                    print(f"Error running {tool_name}: {e}")
                    tool_results[tool_name] = {"error": str(e)}
        
        progress_store[session_id] = {"status": "completed"}
        
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.results_json = {
                "tool_results": tool_results,
                "formatted_findings": all_findings,
                "tools_used": tools,
                "target": target
            }
        
        db.commit()
        print(f"Batch completed: {len(all_findings)} total findings")
        
    except Exception as e:
        print(f"Batch error: {e}")
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "failed"
            session.results_json = {"error": str(e)}
        db.commit()
        progress_store[session_id] = {"status": "failed", "error": str(e)}
    finally:
        db.close()

def parse_findings(tool_name: str, target: str, stdout: str) -> list:
    """Parse findings from tool output"""
    findings = []
    
    if not stdout:
        return [{
            "type": "error",
            "title": "No Output Received",
            "description": f"No output received from {tool_name}",
            "severity": "warning"
        }]
    
    # Check if host is up
    if "Host is up" in stdout or "1 host up" in stdout:
        findings.append({
            "type": "host_status",
            "title": "✅ Host is Reachable",
            "description": f"Target {target} responded to the scan",
            "severity": "success"
        })
    
    # Parse open ports
    port_pattern = re.compile(r'(\d+)/(tcp|udp)\s+open\s+(\S+)', re.IGNORECASE)
    ports = port_pattern.findall(stdout)
    for port, protocol, service in ports:
        findings.append({
            "type": "open_port",
            "title": f"Open Port: {port}/{protocol}",
            "description": f"Service '{service}' is running on port {port}/{protocol}",
            "severity": "info",
            "port": f"{port}/{protocol}",
            "service": service
        })
    
    # Parse service versions
    version_pattern = re.compile(r'(\d+)/(tcp|udp)\s+open\s+(\S+)\s+(.+)', re.IGNORECASE)
    versions = version_pattern.findall(stdout)
    for port, protocol, service, version in versions:
        for f in findings:
            if f.get("port") == f"{port}/{protocol}":
                f["version"] = version.strip()
                f["description"] = f"Service '{service}' version '{version.strip()}' on port {port}/{protocol}"
    
    # Parse OS detection
    os_pattern = re.compile(r'OS details?:?\s*(.+?)(?:\n|$)', re.IGNORECASE)
    os_matches = os_pattern.findall(stdout)
    for os_info in os_matches:
        findings.append({
            "type": "os_detection",
            "title": "Operating System Detected",
            "description": os_info.strip(),
            "severity": "info",
            "os": os_info.strip()
        })
    
    # If no open ports but host is up
    if len([f for f in findings if f.get("type") == "open_port"]) == 0 and "Host is up" in stdout:
        findings.append({
            "type": "no_open_ports",
            "title": "No Open Ports Found",
            "description": "Host is reachable but no open ports were discovered in the default scan range",
            "severity": "warning"
        })
    
    # Add summary
    if findings:
        open_ports_count = len([f for f in findings if f.get("type") == "open_port"])
        findings.insert(0, {
            "type": "scan_summary",
            "title": f"{tool_name.upper()} Scan Results",
            "description": f"Host: {target} | Open Ports: {open_ports_count} | Total Findings: {len(findings)-1}",
            "severity": "info"
        })
    
    return findings
