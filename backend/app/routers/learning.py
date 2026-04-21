from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import logging
from app.database import get_db, UserProgress, QuizAttempt, User
from app.routers.auth import get_current_user
from app.services.learning_service import learning_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/modules")
async def get_modules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    modules = learning_service.get_all_modules()
    
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id
    ).all()
    
    progress_map = {p.module_id: p for p in user_progress}
    
    for module in modules:
        module_id_str = str(module["id"])
        if module_id_str in progress_map:
            module["user_progress"] = {
                "completed": progress_map[module_id_str].completed,
                "score": progress_map[module_id_str].score,
                "last_accessed": progress_map[module_id_str].last_accessed
            }
        else:
            module["user_progress"] = {
                "completed": False,
                "score": 0,
                "last_accessed": None
            }
    
    return modules

@router.get("/modules/{module_id}")
async def get_module(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        content = learning_service.get_module_content(module_id)
        
        progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.module_id == str(module_id)
        ).first()
        
        if progress:
            content["user_progress"] = {
                "completed": progress.completed,
                "score": progress.score,
                "last_accessed": progress.last_accessed
            }
        else:
            content["user_progress"] = {
                "completed": False,
                "score": 0,
                "last_accessed": None
            }
        
        return content
    except ValueError:
        raise HTTPException(status_code=404, detail="Module not found")

@router.post("/modules/{module_id}/quiz/submit")
async def submit_quiz(
    module_id: int,
    answers: List[Dict[str, Any]] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit quiz answers, calculate score, and store history"""
    try:
        logger.info(f"Quiz submission for module {module_id} by user {current_user.id}")
        logger.info(f"Answers received: {answers}")
        
        # Get module questions
        module = learning_service.get_module(module_id)
        questions = module["quiz_questions"]
        
        # Calculate score
        score = 0
        results = []
        
        for answer_item in answers:
            q_idx = answer_item.get("question_index", 0)
            user_answer = answer_item.get("answer", "")
            
            if q_idx < len(questions):
                is_correct = user_answer == questions[q_idx]["correct"]
                if is_correct:
                    score += 1
                
                results.append({
                    "question_index": q_idx,
                    "question": questions[q_idx]["question"],
                    "user_answer": user_answer,
                    "correct_answer": questions[q_idx]["correct"],
                    "is_correct": is_correct,
                    "explanation": questions[q_idx]["explanation"]
                })
        
        total = len(questions)
        percentage = (score / total) * 100 if total > 0 else 0
        passed = percentage >= 70
        
        logger.info(f"Quiz result: score={score}/{total}, percentage={percentage}%, passed={passed}")
        
        # Store quiz attempt
        attempt = QuizAttempt(
            user_id=current_user.id,
            quiz_id=f"module_{module_id}",
            score=score,
            total_questions=total,
            answers_json={
                "answers": answers,
                "results": results,
                "percentage": percentage,
                "passed": passed,
                "submitted_at": datetime.utcnow().isoformat()
            },
            completed_at=datetime.utcnow()
        )
        db.add(attempt)
        
        # Update module progress if passed
        if passed:
            existing = db.query(UserProgress).filter(
                UserProgress.user_id == current_user.id,
                UserProgress.module_id == str(module_id)
            ).first()
            
            if existing:
                existing.completed = True
                existing.score = percentage
                existing.last_accessed = datetime.utcnow()
            else:
                new_progress = UserProgress(
                    user_id=current_user.id,
                    module_id=str(module_id),
                    completed=True,
                    score=percentage,
                    last_accessed=datetime.utcnow()
                )
                db.add(new_progress)
        
        db.commit()
        
        # Get history
        history = db.query(QuizAttempt).filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.quiz_id == f"module_{module_id}"
        ).order_by(QuizAttempt.completed_at.desc()).all()
        
        return {
            "score": score,
            "total": total,
            "percentage": percentage,
            "passed": passed,
            "results": results,
            "history": [
                {
                    "id": h.id,
                    "score": h.score,
                    "total": h.total_questions,
                    "percentage": (h.score / h.total_questions) * 100 if h.total_questions > 0 else 0,
                    "completed_at": h.completed_at
                }
                for h in history
            ]
        }
    except Exception as e:
        logger.error(f"Error submitting quiz: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/modules/{module_id}/quiz/history")
async def get_quiz_history(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's quiz attempt history for a module"""
    history = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.quiz_id == f"module_{module_id}"
    ).order_by(QuizAttempt.completed_at.desc()).all()
    
    return [
        {
            "id": h.id,
            "score": h.score,
            "total": h.total_questions,
            "percentage": (h.score / h.total_questions) * 100 if h.total_questions > 0 else 0,
            "passed": (h.score / h.total_questions) * 100 >= 70 if h.total_questions > 0 else False,
            "completed_at": h.completed_at,
            "answers": h.answers_json
        }
        for h in history
    ]
