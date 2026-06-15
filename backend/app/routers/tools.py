from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import httpx
import asyncio
import re
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.database import get_db, PentestSession, User
from app.routers.auth import get_current_user
from app.config import settings

router = APIRouter()

class BatchExecutionRequest(BaseModel):
    target: str
    tools: list[str]
    auto_mode: bool = False
    parameters: Dict[str, Dict[str, Any]] = Field(default_factory=dict)

class ToolExecutionRequest(BaseModel):
    target: str
    parameters: Dict[str, Any] = Field(default_factory=dict)

progress_store = {}

def serialize_utc(value):
    if not value:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        else:
            value = value.astimezone(timezone.utc)
        return value.isoformat().replace("+00:00", "Z")
    if isinstance(value, str) and "T" in value and not value.endswith("Z") and "+" not in value[10:] and "-" not in value[10:]:
        return f"{value}Z"
    return value

def serialize_tool_calls(tool_calls: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
    serialized = []
    for call in tool_calls:
        next_call = dict(call)
        next_call["started_at"] = serialize_utc(next_call.get("started_at"))
        next_call["completed_at"] = serialize_utc(next_call.get("completed_at"))
        serialized.append(next_call)
    return serialized

def build_tool_payload(tool_name: str, target: str, tool_parameters: Dict[str, Any]) -> Dict[str, Any]:
    payload = {"target": target, **(tool_parameters or {})}

    if tool_name == "gobuster":
        payload.setdefault("url", f"http://{target}")
        payload.setdefault("mode", "dir")
        payload.setdefault("wordlist", "/usr/share/wordlists/dirb/common.txt")
    elif tool_name == "nikto":
        payload["target"] = tool_parameters.get("target") or f"http://{target}"
    elif tool_name == "hydra":
        payload.setdefault("service", "ssh")
    elif tool_name == "enum4linux-ng":
        payload.setdefault("shares", True)
        payload.setdefault("users", True)
        payload.setdefault("groups", True)
        payload.setdefault("policy", True)

    return payload

def build_initial_results(target: str, tools: list[str], parameters: Dict[str, Dict[str, Any]] | None = None) -> Dict[str, Any]:
    parameters = parameters or {}
    return {
        "target": target,
        "tools_used": tools,
        "parameters": parameters,
        "tool_results": {},
        "tool_calls": [
            {
                "tool": tool,
                "status": "queued",
                "parameters": parameters.get(tool, {}),
                "started_at": None,
                "completed_at": None,
                "duration_seconds": None,
                "http_status": None,
                "findings_count": 0,
                "error": None
            }
            for tool in tools
        ],
        "formatted_findings": []
    }

def update_tool_call(results: Dict[str, Any], tool_name: str, **updates) -> Dict[str, Any]:
    next_results = dict(results or {})
    calls = list(next_results.get("tool_calls") or [])
    for idx, call in enumerate(calls):
        if call.get("tool") == tool_name:
            calls[idx] = {**call, **updates}
            break
    else:
        calls.append({
            "tool": tool_name,
            "status": "queued",
            "parameters": (next_results.get("parameters") or {}).get(tool_name, {}),
            "started_at": None,
            "completed_at": None,
            "duration_seconds": None,
            "http_status": None,
            "findings_count": 0,
            "error": None,
            **updates
        })

    next_results["tool_calls"] = calls
    return next_results

def derive_tool_calls(results: Dict[str, Any]) -> list[Dict[str, Any]]:
    tool_results = results.get("tool_results") or {}
    parameters = results.get("parameters") or {}
    findings = results.get("formatted_findings") or []

    return [
        {
            "tool": tool,
            "status": "failed" if isinstance(data, dict) and data.get("error") else "completed",
            "parameters": parameters.get(tool, {}),
            "started_at": None,
            "completed_at": None,
            "duration_seconds": None,
            "http_status": None,
            "findings_count": len([finding for finding in findings if finding.get("tool") == tool]),
            "error": data.get("error") if isinstance(data, dict) else None
        }
        for tool, data in tool_results.items()
    ]

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
        started_at=datetime.utcnow(),
        results_json=build_initial_results(request.target, request.tools, request.parameters)
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
        user_id=current_user.id,
        parameters=request.parameters
    )
    
    return {"success": True, "session_id": session.id}

@router.post("/execute/{tool_name}")
async def execute_tool(
    tool_name: str,
    request: ToolExecutionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = PentestSession(
        user_id=current_user.id,
        target=request.target,
        status="running",
        started_at=datetime.utcnow(),
        results_json=build_initial_results(
            request.target,
            [tool_name],
            {tool_name: request.parameters}
        )
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    progress_store[session.id] = {
        "current_tool": 0,
        "total_tools": 1,
        "current_tool_name": tool_name,
        "status": f"Starting {tool_name}"
    }

    background_tasks.add_task(
        execute_batch_background,
        tools=[tool_name],
        target=request.target,
        session_id=session.id,
        user_id=current_user.id,
        parameters={tool_name: request.parameters}
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
    if results.get("tool_results") and not results.get("tool_calls"):
        results = dict(results)
        results["tool_calls"] = derive_tool_calls(results)
        session.results_json = results
        db.commit()
    
    tool_calls = serialize_tool_calls(results.get("tool_calls", []))
    if results.get("tool_calls"):
        results = dict(results)
        results["tool_calls"] = tool_calls

    return {
        "id": session.id,
        "target": session.target,
        "status": session.status,
        "started_at": serialize_utc(session.started_at),
        "completed_at": serialize_utc(session.completed_at),
        "results": results,
        "tool_calls": tool_calls,
        "tools_used": results.get("tools_used", []),
        "formatted_findings": results.get("formatted_findings", []),
        "findings_count": len(results.get("formatted_findings", [])),
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
            "started_at": serialize_utc(s.started_at),
            "completed_at": serialize_utc(s.completed_at),
            "tools_used": s.results_json.get("tools_used", []) if s.results_json else [],
            "tool_count": len(s.results_json.get("tools_used", [])) if s.results_json else 0,
            "findings_count": len(s.results_json.get("formatted_findings", [])) if s.results_json else 0
        }
        for s in sessions
    ]

@router.delete("/session/{session_id}")
async def delete_session(
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

    db.delete(session)
    db.commit()
    progress_store.pop(session_id, None)
    return {"success": True, "deleted_session_id": session_id}

@router.delete("/history")
async def clear_execution_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(PentestSession).filter(
        PentestSession.user_id == current_user.id
    ).all()
    deleted_count = len(sessions)
    session_ids = [session.id for session in sessions]

    for session in sessions:
        db.delete(session)

    db.commit()
    for session_id in session_ids:
        progress_store.pop(session_id, None)

    return {"success": True, "deleted_count": deleted_count}

async def execute_batch_background(
    tools: list,
    target: str,
    session_id: int,
    user_id: int,
    parameters: Dict[str, Dict[str, Any]] | None = None
):
    from app.database import SessionLocal
    
    db = SessionLocal()
    all_findings = []
    tool_results = {}
    parameters = parameters or {}
    
    try:
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session and not session.results_json:
            session.results_json = build_initial_results(target, tools, parameters)
            db.commit()

        async with httpx.AsyncClient(timeout=300.0) as client:
            for idx, tool_name in enumerate(tools):
                tool_parameters = parameters.get(tool_name, {})
                progress_store[session_id] = {
                    "current_tool": idx,
                    "total_tools": len(tools),
                    "current_tool_name": tool_name,
                    "status": f"Running {tool_name} ({idx+1}/{len(tools)})"
                }
                
                print(f"[{datetime.now()}] Running {tool_name} against {target}")
                tool_started_at = datetime.utcnow()
                request_payload = build_tool_payload(tool_name, target, tool_parameters)
                session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
                if session:
                    current_results = session.results_json or build_initial_results(target, tools, parameters)
                    session.results_json = update_tool_call(
                        current_results,
                        tool_name,
                        status="running",
                        parameters=request_payload,
                        started_at=serialize_utc(tool_started_at),
                        error=None
                    )
                    db.commit()
                
                try:
                    tool_timeout = {
                        "gobuster": 300,
                        "nikto": 300,
                        "hydra": 900,
                        "enum4linux-ng": 300
                    }.get(tool_name, 300)

                    response = await client.post(
                        f"{settings.HEXSTRIKE_URL}/api/tools/{tool_name}",
                        json=request_payload,
                        timeout=tool_timeout
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
                        completed_at = datetime.utcnow()
                        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
                        if session:
                            current_results = dict(session.results_json or build_initial_results(target, tools, parameters))
                            current_tool_results = dict(current_results.get("tool_results") or {})
                            current_tool_results[tool_name] = raw_result
                            current_results["tool_results"] = current_tool_results
                            current_results["formatted_findings"] = all_findings
                            current_results = update_tool_call(
                                current_results,
                                tool_name,
                                status="completed",
                                completed_at=serialize_utc(completed_at),
                                duration_seconds=round((completed_at - tool_started_at).total_seconds(), 2),
                                http_status=response.status_code,
                                findings_count=len(findings),
                                error=None
                            )
                            session.results_json = current_results
                            db.commit()
                        
                    else:
                        error = f"HTTP {response.status_code}"
                        tool_results[tool_name] = {"error": error}
                        completed_at = datetime.utcnow()
                        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
                        if session:
                            current_results = dict(session.results_json or build_initial_results(target, tools, parameters))
                            current_tool_results = dict(current_results.get("tool_results") or {})
                            current_tool_results[tool_name] = {"error": error}
                            current_results["tool_results"] = current_tool_results
                            current_results["formatted_findings"] = all_findings
                            current_results = update_tool_call(
                                current_results,
                                tool_name,
                                status="failed",
                                completed_at=serialize_utc(completed_at),
                                duration_seconds=round((completed_at - tool_started_at).total_seconds(), 2),
                                http_status=response.status_code,
                                findings_count=0,
                                error=error
                            )
                            session.results_json = current_results
                            db.commit()
                        
                except Exception as e:
                    print(f"Error running {tool_name}: {e}")
                    error = str(e)
                    tool_results[tool_name] = {"error": error}
                    completed_at = datetime.utcnow()
                    session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
                    if session:
                        current_results = dict(session.results_json or build_initial_results(target, tools, parameters))
                        current_tool_results = dict(current_results.get("tool_results") or {})
                        current_tool_results[tool_name] = {"error": error}
                        current_results["tool_results"] = current_tool_results
                        current_results["formatted_findings"] = all_findings
                        current_results = update_tool_call(
                            current_results,
                            tool_name,
                            status="failed",
                            completed_at=serialize_utc(completed_at),
                            duration_seconds=round((completed_at - tool_started_at).total_seconds(), 2),
                            findings_count=0,
                            error=error
                        )
                        session.results_json = current_results
                        db.commit()
        
        progress_store[session_id] = {"status": "completed"}
        
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            current_results = dict(session.results_json or build_initial_results(target, tools, parameters))
            current_tool_results = dict(current_results.get("tool_results") or {})
            current_tool_results.update(tool_results)
            current_results["tool_results"] = current_tool_results
            current_results["formatted_findings"] = all_findings
            current_results["tools_used"] = tools
            current_results["parameters"] = parameters
            current_results["target"] = target
            session.results_json = current_results
        
        db.commit()
        print(f"Batch completed: {len(all_findings)} total findings")
        
    except Exception as e:
        print(f"Batch error: {e}")
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "failed"
            current_results = dict(session.results_json or build_initial_results(target, tools, parameters))
            current_results["error"] = str(e)
            session.results_json = current_results
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

    if tool_name == "gobuster":
        path_pattern = re.compile(r'^(?:Found:\s*)?(https?://\S+|/\S+)\s+\(Status:\s*(\d+)\)', re.IGNORECASE | re.MULTILINE)
        for path, status in path_pattern.findall(stdout):
            findings.append({
                "type": "web_path",
                "title": f"Discovered Web Path ({status})",
                "description": path.strip(),
                "severity": "info",
                "status_code": status
            })

    if tool_name == "nikto":
        for line in stdout.splitlines():
            clean_line = line.strip()
            if clean_line.startswith("+") and not clean_line.lower().startswith("+ target"):
                severity = "warning" if any(token in clean_line.lower() for token in ["osvdb", "cve", "vulnerab", "allowed", "outdated"]) else "info"
                findings.append({
                    "type": "web_vulnerability",
                    "title": "Nikto Finding",
                    "description": clean_line.lstrip("+ ").strip(),
                    "severity": severity
                })

    if tool_name == "enum4linux-ng":
        share_pattern = re.compile(r'\b([A-Za-z0-9_$.-]+)\s+(?:Disk|IPC|Printer)\b', re.IGNORECASE)
        for share in sorted(set(share_pattern.findall(stdout))):
            findings.append({
                "type": "smb_share",
                "title": f"SMB Share Found: {share}",
                "description": f"Enum4linux-ng reported SMB share '{share}' on {target}",
                "severity": "info",
                "share": share
            })

        user_pattern = re.compile(r'\buser:\[([^\]]+)\]', re.IGNORECASE)
        for user in sorted(set(user_pattern.findall(stdout))):
            findings.append({
                "type": "smb_user",
                "title": f"SMB User Found: {user}",
                "description": f"Enum4linux-ng reported SMB user '{user}'",
                "severity": "info",
                "user": user
            })

    if tool_name == "hydra":
        credential_pattern = re.compile(r'login:\s*(\S+)\s+password:\s*(\S+)', re.IGNORECASE)
        for username, password in credential_pattern.findall(stdout):
            findings.append({
                "type": "credential",
                "title": f"Valid Credential Found: {username}",
                "description": f"Hydra found valid credentials for {target}: {username}/{password}",
                "severity": "high",
                "username": username,
                "password": password
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
