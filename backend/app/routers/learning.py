from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db, UserProgress, QuizAttempt, FlashcardSet, UserFlashcardProgress, User
from app.routers.auth import get_current_user

router = APIRouter()

class ProgressUpdate(BaseModel):
    module_id: str
    completed: bool
    score: Optional[int] = None
    metadata: Optional[dict] = None

@router.post("/progress")
async def update_progress(
    progress_data: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.module_id == progress_data.module_id
    ).first()
    
    if existing:
        existing.completed = progress_data.completed
        existing.score = progress_data.score
        existing.last_accessed = datetime.utcnow()
        existing.metadata_json = progress_data.metadata or {}
    else:
        new_progress = UserProgress(
            user_id=current_user.id,
            module_id=progress_data.module_id,
            completed=progress_data.completed,
            score=progress_data.score or 0,
            metadata_json=progress_data.metadata or {}
        )
        db.add(new_progress)
    
    db.commit()
    
    return {"success": True}

@router.get("/progress")
async def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id
    ).all()
    
    return {
        "total_modules_completed": len([p for p in progress if p.completed]),
        "completed_modules": [p.module_id for p in progress if p.completed],
        "detailed_progress": [
            {
                "module_id": p.module_id,
                "completed": p.completed,
                "score": p.score,
                "last_accessed": p.last_accessed
            }
            for p in progress
        ]
    }

@router.post("/quiz/submit")
async def submit_quiz(
    submission: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Simplified quiz submission
    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=submission.get("quiz_id", "unknown"),
        score=submission.get("score", 0),
        total_questions=submission.get("total", 0),
        answers_json=submission.get("answers", [])
    )
    db.add(attempt)
    db.commit()
    
    return {
        "score": attempt.score,
        "total": attempt.total_questions,
        "percentage": (attempt.score / attempt.total_questions) * 100 if attempt.total_questions > 0 else 0,
        "attempt_id": attempt.id
    }