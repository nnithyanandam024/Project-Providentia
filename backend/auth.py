import hashlib
import hmac
import base64
import json
import time
from typing import Optional
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import database

SECRET_KEY = "providentia_nabard_secret_key_2026_gff_hackathon"
ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 86400 # 24 hours

security_bearer = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Hashes password using SHA-256."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against hash."""
    return hash_password(plain_password) == hashed_password

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(payload: dict) -> str:
    """Generates a secure JWT token containing user identity and role claims."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload_copy = payload.copy()
    payload_copy["exp"] = int(time.time()) + TOKEN_EXPIRE_SECONDS

    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(payload_copy).encode('utf-8'))

    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_b64 = base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and verifies JWT token signature and expiration."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()

        if base64url_encode(expected_sig) != signature_b64:
            return None

        payload_bytes = base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))

        if payload.get("exp", 0) < time.time():
            return None # Expired token

        return payload
    except Exception:
        return None

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)):
    """FastAPI dependency to extract and validate the authenticated user from JWT token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    identifier = payload.get("sub")
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE identifier = ?", (identifier,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="User account no longer exists.")

    return dict(row)
