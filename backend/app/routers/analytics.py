from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from app.database import get_db, User, PentestSession, QuizAttempt, UserProgress
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get quiz stats
    quiz_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id
    ).all()
    
    avg_quiz_score = sum(a.score for a in quiz_attempts) / len(quiz_attempts) if quiz_attempts else 0
    
    # Get pentest sessions
    sessions = db.query(PentestSession).filter(
        PentestSession.user_id == current_user.id
    ).all()
    
    successful_sessions = len([s for s in sessions if s.status == "completed"])
    
    # Get progress
    completed_modules = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.completed == True
    ).count()
    
    return {
        "total_quizzes_taken": len(quiz_attempts),
        "average_quiz_score": avg_quiz_score,
        "total_pentest_sessions": len(sessions),
        "successful_sessions": successful_sessions,
        "completed_modules": completed_modules,
        "total_experience_points": completed_modules * 100 + successful_sessions * 50,
        "current_streak": 7,
        "hours_spent": completed_modules * 2
    }

@router.get("/progress")
async def get_progress_data(
    range: str = Query("week", description="Time range: week, month, year"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if range == "week":
        return [
            {"name": "Mon", "score": 65, "modules": 1, "time": 45},
            {"name": "Tue", "score": 72, "modules": 2, "time": 90},
            {"name": "Wed", "score": 78, "modules": 1, "time": 60},
            {"name": "Thu", "score": 85, "modules": 3, "time": 120},
            {"name": "Fri", "score": 88, "modules": 2, "time": 75},
            {"name": "Sat", "score": 90, "modules": 1, "time": 30},
            {"name": "Sun", "score": 92, "modules": 2, "time": 105}
        ]
    elif range == "month":
        return [
            {"name": "Week 1", "score": 65, "modules": 5, "time": 300},
            {"name": "Week 2", "score": 72, "modules": 7, "time": 420},
            {"name": "Week 3", "score": 78, "modules": 6, "time": 360},
            {"name": "Week 4", "score": 85, "modules": 8, "time": 480}
        ]
    else:
        return [
            {"name": "Jan", "score": 55, "modules": 12, "time": 720},
            {"name": "Feb", "score": 62, "modules": 15, "time": 900},
            {"name": "Mar", "score": 68, "modules": 18, "time": 1080},
            {"name": "Apr", "score": 72, "modules": 20, "time": 1200},
            {"name": "May", "score": 75, "modules": 22, "time": 1320},
            {"name": "Jun", "score": 78, "modules": 25, "time": 1500}
        ]

@router.get("/achievements")
async def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return [
        {"id": 1, "name": "First Blood", "description": "Completed first penetration test", "earned": True, "icon": "🎯"},
        {"id": 2, "name": "Bug Hunter", "description": "Found 10 vulnerabilities", "earned": True, "icon": "🐛"},
        {"id": 3, "name": "Quiz Master", "description": "Scored 100% on 5 quizzes", "earned": False, "icon": "📝"},
        {"id": 4, "name": "Speed Runner", "description": "Completed pentest under 5 minutes", "earned": False, "icon": "⚡"},
        {"id": 5, "name": "Night Owl", "description": "Studied after midnight", "earned": True, "icon": "🦉"}
    ]
