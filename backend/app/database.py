from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from app.config import settings
import warnings

# Suppress SQLAlchemy's typing warnings for Python 3.13
warnings.filterwarnings("ignore", category=UserWarning, module="sqlalchemy")

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("PentestSession", back_populates="user", cascade="all, delete-orphan")

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    module_id = Column(String, index=True)
    completed = Column(Boolean, default=False)
    score = Column(Integer, default=0)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(JSON, default={})
    
    user = relationship("User", back_populates="progress")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(String, index=True)
    score = Column(Integer)
    total_questions = Column(Integer)
    answers_json = Column(JSON)
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="quiz_attempts")

class PentestSession(Base):
    __tablename__ = "pentest_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    target = Column(String)
    status = Column(String, default="pending")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    results_json = Column(JSON, default={})
    ai_explanations_json = Column(JSON, default={})
    
    user = relationship("User", back_populates="sessions")

class FlashcardSet(Base):
    __tablename__ = "flashcard_sets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    topic = Column(String, index=True)
    cards_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserFlashcardProgress(Base):
    __tablename__ = "user_flashcard_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    flashcard_id = Column(Integer)
    mastery_level = Column(Integer, default=0)
    last_reviewed = Column(DateTime)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
