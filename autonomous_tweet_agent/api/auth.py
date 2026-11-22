"""Simple username/password auth for the dashboard.

Credentials come from env vars:
  DASHBOARD_USERNAME, DASHBOARD_PASSWORD  - the login
  AUTH_SECRET                             - key used to sign session tokens
  AUTH_TOKEN_TTL_HOURS (optional)         - token lifetime, default 168 (7 days)

Tokens are HMAC-signed (stdlib only, no extra dependencies).
"""
import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import Header, HTTPException


def _secret() -> bytes:
    secret = os.getenv("AUTH_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="AUTH_SECRET is not configured on the server")
    return secret.encode()


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _unb64(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def check_credentials(username: str, password: str) -> bool:
    expected_user = os.getenv("DASHBOARD_USERNAME")
    expected_pass = os.getenv("DASHBOARD_PASSWORD")
    if not expected_user or not expected_pass:
        # Fail closed: no credentials configured means nobody can log in.
        return False
    user_ok = hmac.compare_digest(username.encode(), expected_user.encode())
    pass_ok = hmac.compare_digest(password.encode(), expected_pass.encode())
    return user_ok and pass_ok


def create_token(username: str) -> tuple[str, int]:
    ttl_hours = float(os.getenv("AUTH_TOKEN_TTL_HOURS", "168"))
    expires_at = int(time.time() + ttl_hours * 3600)
    payload = _b64(json.dumps({"sub": username, "exp": expires_at}).encode())
    sig = _b64(hmac.new(_secret(), payload.encode(), hashlib.sha256).digest())
    return f"{payload}.{sig}", expires_at


def verify_token(token: str) -> str | None:
    try:
        payload, sig = token.split(".", 1)
        expected = _b64(hmac.new(_secret(), payload.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(_unb64(payload))
        if data.get("exp", 0) < time.time():
            return None
        return data.get("sub")
    except HTTPException:
        raise
    except Exception:
        return None


async def require_auth(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency: rejects requests without a valid Bearer token."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = verify_token(authorization[7:].strip())
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid. Please log in again.")
    return user
