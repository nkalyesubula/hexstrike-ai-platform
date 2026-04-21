from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.database import get_db, User
from app.utils.hasher import hash_password, verify_password
from app.config import settings

router = APIRouter()

# Use settings from .env
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"[DEBUG] Created token for user_id: {data.get('sub')}")
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    print(f"[DEBUG] get_current_user called with token: {token[:50] if token else 'None'}...")
    
    if not token:
        print("[DEBUG] No token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # First, try to decode without verification to see the payload
        import jwt as pyjwt
        unverified = pyjwt.decode(token, options={"verify_signature": False})
        print(f"[DEBUG] Unverified payload: {unverified}")
        
        # Now decode with verification
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        print(f"[DEBUG] Decoded user_id from token: {user_id_str} (type: {type(user_id_str)})")
        
        if user_id_str is None:
            print("[DEBUG] No user_id in token")
            raise credentials_exception
        
        user_id = int(user_id_str)
        print(f"[DEBUG] Looking for user with id: {user_id}")
        
    except JWTError as e:
        print(f"[DEBUG] JWT Error: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"[DEBUG] Unexpected error: {e}")
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print(f"[DEBUG] User not found with id: {user_id}")
        raise credentials_exception
    
    print(f"[DEBUG] User authenticated: {user.username}")
    return user

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User with this email or username already exists"
        )
    
    try:
        hashed_pw = hash_password(user_data.password)
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_pw,
            full_name=user_data.full_name,
            created_at=datetime.utcnow(),
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"[DEBUG] User created: {new_user.username} (ID: {new_user.id})")
        return new_user
    except Exception as e:
        db.rollback()
        print(f"[DEBUG] Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"[DEBUG] Login attempt for username: {form_data.username}")
    
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user:
        print(f"[DEBUG] User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    is_valid = verify_password(form_data.password, user.hashed_password)
    print(f"[DEBUG] Password valid: {is_valid}")
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Convert user.id to string for JWT sub claim
    access_token = create_access_token(data={"sub": str(user.id)})
    print(f"[DEBUG] Login successful for {user.username}, token created")
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    print(f"[DEBUG] Returning user info for: {current_user.username}")
    return current_user

@router.get("/debug-token")
async def debug_token(authorization: str = None):
    """Debug endpoint to check token"""
    if not authorization:
        return {"error": "No authorization header"}
    
    token = authorization.replace("Bearer ", "")
    print(f"[DEBUG] Debug token: {token[:50]}...")
    
    try:
        # Try to decode
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"valid": True, "payload": payload}
    except Exception as e:
        print(f"[DEBUG] Debug error: {e}")
        return {"valid": False, "error": str(e)}
