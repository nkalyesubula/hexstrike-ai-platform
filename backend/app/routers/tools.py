from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import httpx
import asyncio
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db, PentestSession, User
from app.routers.auth import get_current_user
from app.config import settings
from app.services.tools_service import tools_service

router = APIRouter()

class ToolExecutionRequest(BaseModel):
    target: str
    tool_name: str
    parameters: Dict[str, Any] = {}

class BatchExecutionRequest(BaseModel):
    target: str
    tools: list[str]
    auto_mode: bool = False

@router.get("/available")
async def get_available_tools():
    """Get all available tools with their configurations"""
    return {
        "tools": tools_service.get_all_tools(),
        "categories": tools_service.get_categories(),
        "total": len(tools_service.get_all_tools())
    }

@router.get("/available/{category}")
async def get_tools_by_category(category: str):
    """Get tools filtered by category"""
    tools = tools_service.get_tools_by_category(category)
    return {"category": category, "tools": tools, "count": len(tools)}

@router.post("/execute/{tool_name}")
async def execute_tool(
    tool_name: str,
    request: ToolExecutionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if tool exists
    tool_config = tools_service.get_tool(tool_name)
    if not tool_config:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")
    
    # Create session record
    session = PentestSession(
        user_id=current_user.id,
        target=request.target,
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Execute in background
    background_tasks.add_task(
        execute_tool_background,
        tool_name=tool_name,
        target=request.target,
        parameters=request.parameters,
        session_id=session.id,
        user_id=current_user.id
    )
    
    return {
        "success": True,
        "message": f"Tool {tool_config['name']} execution started",
        "session_id": session.id
    }

@router.post("/batch")
async def execute_batch(
    request: BatchExecutionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate all tools exist
    for tool in request.tools:
        if not tools_service.get_tool(tool):
            raise HTTPException(status_code=404, detail=f"Tool '{tool}' not found")
    
    # Create session record
    session = PentestSession(
        user_id=current_user.id,
        target=request.target,
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Execute in background
    background_tasks.add_task(
        execute_batch_background,
        tools=request.tools,
        target=request.target,
        session_id=session.id,
        user_id=current_user.id
    )
    
    return {
        "success": True,
        "session_id": session.id
    }

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
    
    return {
        "id": session.id,
        "status": session.status,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
        "results": session.results_json,
        "raw_output": session.results_json.get("raw_output", "") if session.results_json else "",
        "formatted_findings": session.results_json.get("formatted_findings", []) if session.results_json else []
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

async def execute_tool_background(tool_name: str, target: str, parameters: dict, session_id: int, user_id: int):
    from app.database import SessionLocal
    
    db = SessionLocal()
    tool_config = tools_service.get_tool(tool_name)
    
    try:
        # Call actual HexStrike API
        async with httpx.AsyncClient(timeout=300.0) as client:
            # Build the payload for HexStrike
            payload = {
                "target": target,
                **parameters
            }
            
            response = await client.post(
                f"{settings.HEXSTRIKE_URL}/api/tools/{tool_name}",
                json=payload
            )
            
            if response.status_code == 200:
                raw_result = response.json()
                
                # Parse the real results from HexStrike
                findings = parse_hexstrike_results(tool_name, target, raw_result)
                
                # Update session with real results
                session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
                if session:
                    session.status = "completed"
                    session.completed_at = datetime.utcnow()
                    session.results_json = {
                        "raw_output": raw_result,
                        "formatted_findings": findings,
                        "summary": f"{tool_config['name']} scan completed on {target}",
                        "tool": tool_name,
                        "target": target
                    }
            else:
                raise Exception(f"HexStrike returned {response.status_code}: {response.text}")
        
        db.commit()
        print(f"Tool {tool_name} completed for session {session_id}")
        
    except Exception as e:
        print(f"Error in tool execution: {e}")
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "failed"
            session.results_json = {"error": str(e), "raw_output": None}
        db.commit()
    finally:
        db.close()

async def execute_batch_background(tools: list, target: str, session_id: int, user_id: int):
    from app.database import SessionLocal
    
    db = SessionLocal()
    all_findings = []
    all_raw_outputs = {}
    
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            for tool_name in tools:
                tool_config = tools_service.get_tool(tool_name)
                
                response = await client.post(
                    f"{settings.HEXSTRIKE_URL}/api/tools/{tool_name}",
                    json={"target": target}
                )
                
                if response.status_code == 200:
                    raw_result = response.json()
                    all_raw_outputs[tool_name] = raw_result
                    
                    findings = parse_hexstrike_results(tool_name, target, raw_result)
                    all_findings.extend(findings)
                else:
                    all_raw_outputs[tool_name] = {"error": f"Failed with status {response.status_code}"}
        
        # Update session with all results
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.results_json = {
                "raw_outputs": all_raw_outputs,
                "formatted_findings": all_findings,
                "tools_used": tools,
                "target": target,
                "summary": f"Completed scan of {target} with {len(tools)} tools. Found {len(all_findings)} findings."
            }
        
        db.commit()
        print(f"Batch completed for session {session_id} with {len(all_findings)} findings")
        
    except Exception as e:
        print(f"Error in batch execution: {e}")
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "failed"
            session.results_json = {"error": str(e)}
        db.commit()
    finally:
        db.close()

def parse_hexstrike_results(tool_name: str, target: str, raw_result: dict) -> list:
    """Parse actual HexStrike output into structured findings"""
    findings = []
    
    # Extract stdout from HexStrike response
    stdout = raw_result.get("stdout", "") if isinstance(raw_result, dict) else str(raw_result)
    
    if tool_name == "nmap":
        # Parse Nmap output for open ports
        lines = stdout.split('\n')
        for line in lines:
            if '/tcp' in line or '/udp' in line:
                parts = line.split()
                if len(parts) >= 3 and ('open' in line or 'filtered' in line):
                    port = parts[0]
                    service = parts[2] if len(parts) > 2 else "unknown"
                    findings.append({
                        "type": "open_port",
                        "title": f"Open Port: {port}",
                        "description": f"Service '{service}' is running on port {port}",
                        "severity": "info",
                        "remediation": "Review if this port needs to be publicly accessible"
                    })
    
    elif tool_name == "gobuster":
        # Parse Gobuster output for discovered paths
        lines = stdout.split('\n')
        for line in lines:
            if 'Status: 200' in line or 'Status: 301' in line or 'Status: 403' in line:
                parts = line.split()
                for part in parts:
                    if part.startswith('/'):
                        findings.append({
                            "type": "discovered_path",
                            "title": f"Discovered: {part}",
                            "description": f"Found accessible path: {part}",
                            "severity": "medium" if 'admin' in part or 'config' in part else "info",
                            "remediation": "Review if this path should be publicly accessible"
                        })
    
    elif tool_name == "nuclei":
        # Parse Nuclei output for vulnerabilities
        lines = stdout.split('\n')
        for line in lines:
            if '[critical]' in line.lower():
                findings.append({
                    "type": "vulnerability",
                    "title": line[:100],
                    "description": "Critical vulnerability detected",
                    "severity": "critical",
                    "remediation": "Apply security patches immediately"
                })
            elif '[high]' in line.lower():
                findings.append({
                    "type": "vulnerability",
                    "title": line[:100],
                    "description": "High severity vulnerability detected",
                    "severity": "high",
                    "remediation": "Apply security patches soon"
                })
    
    return findings
