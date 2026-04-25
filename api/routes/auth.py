"""
api/routes/auth.py — Supabase Auth integration.
Free/paid tier gate via Supabase JWT validation.
"""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter(tags=["auth"])
bearer = HTTPBearer(auto_error=False)

# Module-level client — created once, reused across requests
_auth_client = None


def _get_auth_client():
    global _auth_client
    if _auth_client is None:
        from supabase import create_client
        _auth_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_ANON_KEY"],
        )
    return _auth_client


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict | None:
    if not credentials:
        return None
    try:
        client = _get_auth_client()
        user   = client.auth.get_user(credentials.credentials)
        return user.user if user else None
    except Exception:
        return None


def require_auth(user: dict | None = Depends(get_current_user)) -> dict:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def get_tier(user: dict | None) -> str:
    """Returns 'free' | 'paid' based on user metadata."""
    if not user:
        return "free"
    meta = (user.user_metadata or {}) if hasattr(user, "user_metadata") else {}
    return meta.get("tier", "free")


@router.get("/auth/me")
async def me(user: dict | None = Depends(get_current_user)):
    if not user:
        return {"authenticated": False}
    return {"authenticated": True, "id": user.id, "email": user.email, "tier": get_tier(user)}
