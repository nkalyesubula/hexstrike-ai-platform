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

router = APIRouter()

class ToolExecutionRequest(BaseModel):
    target: str
    tool_name: str
    parameters: Dict[str, Any] = {}

class BatchExecutionRequest(BaseModel):
    target: str
    tools: list[str]
    auto_mode: bool = False

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
        status="running"
    )
    db.add(session)
    db.commit()
    
    background_tasks.add_task(
        execute_tool_background,
        tool_name=tool_name,
        target=request.target,
        parameters=request.parameters,
        session_id=session.id
    )
    
    return {
        "success": True,
        "message": f"Tool {tool_name} execution started",
        "session_id": session.id
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
        status="running"
    )
    db.add(session)
    db.commit()
    
    background_tasks.add_task(
        execute_batch_background,
        tools=request.tools,
        target=request.target,
        session_id=session.id
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
        "explanations": session.ai_explanations_json
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
            "completed_at": s.completed_at
        }
        for s in sessions
    ]

async def execute_tool_background(tool_name: str, target: str, parameters: dict, session_id: int):
    from app.database import SessionLocal
    from app.config import settings
    
    db = SessionLocal()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.HEXSTRIKE_URL}/api/tools/{tool_name}",
                json={"target": target, **parameters},
                timeout=300
            )
            
            result = response.json()
            
            session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
            if session:
                session.status = "completed" if result.get("success") else "failed"
                session.completed_at = datetime.utcnow()
                session.results_json = result
            
            db.commit()
            
    except Exception as e:
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "failed"
            session.results_json = {"error": str(e)}
        db.commit()
    finally:
        db.close()

async def execute_batch_background(tools: list, target: str, session_id: int):
    from app.database import SessionLocal
    from app.config import settings
    
    db = SessionLocal()
    results = {}
    
    try:
        for tool in tools:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.HEXSTRIKE_URL}/api/tools/{tool}",
                    json={"target": target},
                    timeout=300
                )
                results[tool] = response.json()
                await asyncio.sleep(2)
        
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.results_json = results
        
        db.commit()
        
    except Exception as e:
        session = db.query(PentestSession).filter(PentestSession.id == session_id).first()
        if session:
            session.status = "failed"
            session.results_json = {"error": str(e)}
        db.commit()
    finally:
        db.close()