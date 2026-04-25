"""
api/middleware/rate_limit.py — Sliding window rate limiter via Redis.
Free: 10 req/min per IP. Paid: 100 req/min per verified user.
"""

from __future__ import annotations

import hashlib
import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

FREE_LIMIT       = 10   # per minute
PAID_LIMIT       = 100  # per minute
WINDOW           = 60   # seconds

FREE_DAILY_QUOTA = 5    # searches/day (roadmap: free tier)
PAID_DAILY_QUOTA = 100  # searches/day (roadmap: Lite tier baseline)

_QUOTA_PATHS = {"/api/v1/search", "/api/v1/export"}

_EXEMPT_PATHS = {"/api/v1/health", "/docs", "/openapi.json", "/api/v1/auth/me"}


def _make_identifier(request: Request) -> tuple[str, int]:
    """Return (redis_key_segment, limit). Token must be verified to get paid limit."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        # Hash full token — never use prefix (JWTs share "eyJ..." prefix)
        token_hash = hashlib.sha256(token.encode()).hexdigest()[:16]
        # Mark as unverified — auth route validates; rate limiter gives paid only if verified
        request.state.token_hash = token_hash
        return f"user:{token_hash}", PAID_LIMIT
    ip = (request.client.host if request.client else "unknown")
    return f"ip:{ip}", FREE_LIMIT


async def _check_daily_quota(redis, identifier: str, is_paid: bool) -> bool:
    """Returns True if request is within daily quota. False = exceeded."""
    from datetime import date
    quota_key = f"n2nd:quota:{identifier}:{date.today().isoformat()}"
    count = await redis.incr(quota_key)
    if count == 1:
        await redis.expire(quota_key, 86_400)
    limit = PAID_DAILY_QUOTA if is_paid else FREE_DAILY_QUOTA
    return count <= limit


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in _EXEMPT_PATHS:
            return await call_next(request)

        try:
            from processing.cache import get_redis
            redis = get_redis()

            identifier, limit = _make_identifier(request)
            is_paid = limit == PAID_LIMIT

            # Daily quota check for search/export endpoints
            if request.url.path in _QUOTA_PATHS:
                within_quota = await _check_daily_quota(redis, identifier, is_paid)
                if not within_quota:
                    return Response(
                        content='{"detail":"Daily query quota exceeded"}',
                        status_code=429,
                        media_type="application/json",
                        headers={"Retry-After": "86400"},
                    )

            window_key = f"n2nd:ratelimit:{identifier}:{int(time.time()) // WINDOW}"

            count = await redis.incr(window_key)
            if count == 1:
                await redis.expire(window_key, WINDOW * 2)

            reset_at  = (int(time.time()) // WINDOW + 1) * WINDOW
            remaining = max(0, limit - count)

            # Block BEFORE processing — don't waste embed/DB calls on over-limit requests
            if count > limit:
                return Response(
                    content='{"detail":"Rate limit exceeded"}',
                    status_code=429,
                    media_type="application/json",
                    headers={
                        "Retry-After":           str(WINDOW),
                        "X-RateLimit-Limit":     str(limit),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset":     str(reset_at),
                    },
                )

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"]     = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"]     = str(reset_at)
            return response

        except Exception:
            # Rate limiter failure must never block requests
            return await call_next(request)
