from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from collections import defaultdict
import builtins
from app.database import get_db, User, PentestSession, QuizAttempt, UserProgress
from app.routers.auth import get_current_user
from app.services.learning_service import learning_service

router = APIRouter()

def _attempt_percentage(attempt: QuizAttempt) -> float:
    if not attempt.total_questions:
        return 0
    return round((attempt.score / attempt.total_questions) * 100, 2)

def _session_findings_count(session: PentestSession) -> int:
    results = session.results_json or {}
    return len(results.get("formatted_findings", []))

def _module_xp_map() -> dict[str, int]:
    return {str(module["id"]): module.get("xp", 100) for module in learning_service.get_all_modules()}

def _current_streak(progress_items: list[UserProgress], quiz_attempts: list[QuizAttempt]) -> int:
    active_days = {
        item.last_accessed.date()
        for item in progress_items
        if item.last_accessed
    }
    active_days.update(
        attempt.completed_at.date()
        for attempt in quiz_attempts
        if attempt.completed_at
    )

    streak = 0
    cursor = datetime.utcnow().date()
    while cursor in active_days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak

def _bucket_label(date_value, range_name: str) -> str:
    if range_name == "week":
        return date_value.strftime("%a")
    if range_name == "month":
        week_number = ((date_value.day - 1) // 7) + 1
        return f"Week {week_number}"
    return date_value.strftime("%b")

@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get quiz stats
    quiz_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id
    ).all()
    
    avg_quiz_score = (
        sum(_attempt_percentage(a) for a in quiz_attempts) / len(quiz_attempts)
        if quiz_attempts else 0
    )
    
    # Get pentest sessions
    sessions = db.query(PentestSession).filter(
        PentestSession.user_id == current_user.id
    ).all()
    
    successful_sessions = len([s for s in sessions if s.status == "completed"])
    total_findings = sum(_session_findings_count(s) for s in sessions)
    
    # Get progress
    progress_items = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id
    ).all()
    completed_progress = [p for p in progress_items if p.completed]
    xp_by_module = _module_xp_map()
    module_xp = sum(xp_by_module.get(str(p.module_id), 100) for p in completed_progress)
    
    return {
        "total_quizzes_taken": len(quiz_attempts),
        "average_quiz_score": round(avg_quiz_score, 2),
        "total_pentest_sessions": len(sessions),
        "successful_sessions": successful_sessions,
        "completed_modules": len(completed_progress),
        "total_findings": total_findings,
        "total_experience_points": module_xp + successful_sessions * 50,
        "current_streak": _current_streak(progress_items, quiz_attempts),
        "hours_spent": round(len(progress_items) * 0.5 + len(quiz_attempts) * 0.25 + len(sessions) * 0.75, 1)
    }

@router.get("/progress")
async def get_progress_data(
    range: str = Query("week", description="Time range: week, month, year"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    range = range if range in {"week", "month", "year"} else "week"
    now = datetime.utcnow()
    start = {
        "week": now - timedelta(days=6),
        "month": now.replace(day=1),
        "year": now.replace(month=1, day=1),
    }[range].date()

    quiz_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.completed_at >= datetime.combine(start, datetime.min.time())
    ).all()
    progress_items = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.last_accessed >= datetime.combine(start, datetime.min.time())
    ).all()

    buckets = defaultdict(lambda: {"scores": [], "modules": 0, "time": 0})
    for attempt in quiz_attempts:
        if attempt.completed_at:
            label = _bucket_label(attempt.completed_at.date(), range)
            buckets[label]["scores"].append(_attempt_percentage(attempt))
            buckets[label]["time"] += 15

    for item in progress_items:
        if item.last_accessed:
            label = _bucket_label(item.last_accessed.date(), range)
            buckets[label]["modules"] += 1 if item.completed else 0
            buckets[label]["time"] += 30

    if range == "week":
        labels = [(start + timedelta(days=i)).strftime("%a") for i in builtins.range(7)]
    elif range == "month":
        labels = [f"Week {i}" for i in builtins.range(1, 6)]
    else:
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    data = []
    for label in labels:
        bucket = buckets[label]
        scores = bucket["scores"]
        data.append({
            "name": label,
            "score": round(sum(scores) / len(scores), 2) if scores else 0,
            "modules": bucket["modules"],
            "time": bucket["time"]
        })
    return data

@router.get("/achievements")
async def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(PentestSession).filter(PentestSession.user_id == current_user.id).all()
    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()
    completed_modules = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.completed == True
    ).count()

    completed_sessions = [s for s in sessions if s.status == "completed"]
    total_findings = sum(_session_findings_count(s) for s in completed_sessions)
    perfect_quizzes = len([a for a in quiz_attempts if a.total_questions and a.score == a.total_questions])
    fast_sessions = len([
        s for s in completed_sessions
        if s.started_at and s.completed_at and (s.completed_at - s.started_at).total_seconds() <= 300
    ])

    return [
        {
            "id": 1,
            "name": "First Scan",
            "description": "Complete your first penetration test",
            "earned": len(completed_sessions) >= 1,
            "icon": "🎯",
            "progress": f"{min(len(completed_sessions), 1)}/1"
        },
        {
            "id": 2,
            "name": "Finding Finder",
            "description": "Discover 10 scan findings",
            "earned": total_findings >= 10,
            "icon": "🔎",
            "progress": f"{min(total_findings, 10)}/10"
        },
        {
            "id": 3,
            "name": "Quiz Master",
            "description": "Score 100% on 5 quizzes",
            "earned": perfect_quizzes >= 5,
            "icon": "📝",
            "progress": f"{min(perfect_quizzes, 5)}/5"
        },
        {
            "id": 4,
            "name": "Fast Operator",
            "description": "Complete a pentest in under 5 minutes",
            "earned": fast_sessions >= 1,
            "icon": "⚡",
            "progress": f"{min(fast_sessions, 1)}/1"
        },
        {
            "id": 5,
            "name": "Course Climber",
            "description": "Complete 3 learning modules",
            "earned": completed_modules >= 3,
            "icon": "🏆",
            "progress": f"{min(completed_modules, 3)}/3"
        }
    ]
