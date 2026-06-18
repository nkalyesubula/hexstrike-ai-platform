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
    
    # Tool classifications - only special cases
    # Make sure this list includes ALL web tools
    # Tool classifications based on your tools_service.py
    needs_url_prefix = [
        "nikto", "gobuster", "nuclei", "wpscan", "whatweb", "dirb", "dirsearch", 
        "ffuf", "wfuzz", "gau", "katana", "hakrawler", "httpx", "feroxbuster", 
        "jaeles", "dalfox", "wafw00f", "testssl", "sslscan", "sslyze", "jwt_tool",
        "arjun", "paramspider", "x8", "graphql_voyager"
    ]

    needs_url_param = ["sqlmap"]

    needs_url_parameter = [
        "gobuster","wpscan", "whatweb", "dirb", "dirsearch", 
        "ffuf", "wfuzz", "httpx", "feroxbuster", "jaeles", "dalfox"
    ]

    skip_tools = [
        "hydra", "john", "metasploit", "volatility", "aircrack", 
        "setoolkit", "theharvester", "recon", "autopsy", "nessus"
    ]
    
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
                
                # Build target based on tool type
                scan_target = target
                if tool_name in needs_url_prefix:
                    if not (target.startswith("http://") or target.startswith("https://")):
                        scan_target = f"http://{target}"
                    if scan_target.endswith('/'):
                        scan_target = scan_target[:-1]
                    print(f"  Converted target to: {scan_target}")
                elif tool_name in needs_url_param:
                    if not (target.startswith("http://") or target.startswith("https://")):
                        scan_target = f"http://{target}"
                    if '?' not in scan_target:
                        error_msg = f"{tool_name} requires a URL with parameter (e.g., http://example.com/page.php?id=1)"
                        all_findings.append({"type": "error", "title": f"{tool_name} Error", "description": error_msg, "severity": "error", "tool": tool_name})
                        tool_results[tool_name] = {"error": error_msg}
                        continue
                
                # Build payload (uniform for all tools)
                if tool_name in needs_url_param:
                   # payload = {"url": scan_target, "batch": True}
                    payload = {"url": scan_target, "batch": True, "level": 1, "risk": 1}
                elif tool_name in needs_url_parameter:
                # Web tools that need 'url' parameter
                    payload = {"url": scan_target}
                else:
                    payload = {"target": scan_target}
                
                print(f"[{datetime.now()}] Running {tool_name} against {scan_target}")
                print(f"  Payload for {tool_name}: {payload}")
                tool_started_at = datetime.utcnow()
                session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
                if session:
                    current_results = session.results_json or build_initial_results(target, tools, parameters)
                    session.results_json = update_tool_call(
                        current_results,
                        tool_name,
                        status="running",
                        parameters=tool_parameters,
                        started_at=serialize_utc(tool_started_at),
                        error=None
                    )
                    db.commit()
                
                try:
                    response = await client.post(
                        f"{settings.HEXSTRIKE_URL}/api/tools/{tool_name}",
                        json=payload,
                        timeout=600
                    )
                    
                    if response.status_code == 200:
                        raw_result = response.json()
                        tool_results[tool_name] = raw_result
                        
                        # Get output (works for ALL tools)
                        output = raw_result.get("stdout", "")
                        if not output:
                            output = raw_result.get("stderr", "")
                        if not output:
                            output = str(raw_result)
                        
                        # UNIVERSAL PARSER - works for ANY tool output
                        findings = universal_parse_findings(tool_name, target, output)
                        
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
        print(f"Batch completed: {len(all_findings)} findings")
        
    except Exception as e:
        print(f"Batch error: {e}")
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "failed"
            current_results = dict(session.results_json or build_initial_results(target, tools, parameters))
            current_results["error"] = str(e)
            session.results_json = current_results
        db.commit()
    finally:
        db.close()


def universal_parse_findings(tool_name: str, target: str, output: str) -> list:
    """Universal parser that works for ANY tool output"""
    findings = []
    
    if not output or len(output) < 10:
        return findings
    
    lines = output.split('\n')
    finding_lines = []
    
    # Collect lines that look like findings (common patterns across tools)
    for line in lines:
        line = line.strip()
        if not line or len(line) < 5:
            continue
        
        # Skip common non-finding lines
        skip_patterns = [
            "Starting", "Scanning", "Completed", "Summary", "Report", 
            "Statistics", "---", "====", "Copyright", "License", "Usage",
            "Options:", "Examples:", "Target IP:", "Target Hostname:", "Start Time:", "End Time:"
        ]
        if any(pattern.lower() in line.lower() for pattern in skip_patterns):
            continue
        
        # Lines that likely contain findings (indicators of issues)
        finding_indicators = [
            "open", "vulnerable", "found", "detected", "discovered", "exposed",
            "missing", "error", "warning", "critical", "high", "medium", "low",
            "info", "cve", "exploit", "credentials", "password", "injection",
            "xss", "sql", "directory", "file", "port", "service", "version"
        ]
        
        if any(indicator in line.lower() for indicator in finding_indicators):
            finding_lines.append(line)
    
    # Also capture lines with special prefixes
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Lines starting with +, -, *, >, # often contain findings
        if line[0] in ['+', '-', '*', '>', '#'] and len(line) > 3:
            if not any(p in line for p in ["--", "====", "----"]):
                finding_lines.append(line[1:].strip())
    
    # Remove duplicates while preserving order
    unique_lines = []
    for line in finding_lines:
        if line not in unique_lines:
            unique_lines.append(line)
    
    # Create findings from unique lines
    for line in unique_lines[:50]:  # Limit to 50 findings per tool
        # Determine severity from content
        severity = "info"
        lower_line = line.lower()
        if any(w in lower_line for w in ["critical", "cve-", "exploit", "credentials", "password", "injection", "rce", "remote code"]):
            severity = "critical"
        elif any(w in lower_line for w in ["high", "vulnerable", "xss", "sql", "overflow"]):
            severity = "high"
        elif any(w in lower_line for w in ["medium", "directory", "exposed", "information disclosure"]):
            severity = "medium"
        elif any(w in lower_line for w in ["low", "missing", "header"]):
            severity = "low"
        
        # Truncate long lines
        title = line[:80] + "..." if len(line) > 80 else line
        
        findings.append({
            "type": "finding",
            "title": title,
            "description": line[:300],
            "severity": severity,
            "details": line
        })
    
    # Add summary if we have findings
    if findings:
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for f in findings:
            severity_counts[f["severity"]] = severity_counts.get(f["severity"], 0) + 1
        
        findings.insert(0, {
            "type": "scan_summary",
            "title": f"{tool_name.upper()} Scan Results",
            "description": f"Found {len(findings)} issues (Critical: {severity_counts['critical']}, High: {severity_counts['high']}, Medium: {severity_counts['medium']}, Low: {severity_counts['low']}, Info: {severity_counts['info']})",
            "severity": "success"
        })
    
    return findings