import hashlib
import secrets
from passlib.context import CryptContext

# Use a simpler hashing scheme that works with Python 3.13
# PBKDF2 is well-supported and doesn't have the bcrypt issues
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    pbkdf2_sha256__default_rounds=10000,
    deprecated="auto"
)

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False
