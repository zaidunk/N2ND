"""
api/middleware/injection.py — Prompt injection filter for query endpoints.
Blocks known injection patterns without over-blocking legitimate queries.
"""

from __future__ import annotations

import re

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response

_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(previous|above|all|prior)\s+instructions?", re.I),
    re.compile(r"you\s+are\s+now\s+(a|an|the)\s+\w+", re.I),
    re.compile(r"disregard\s+your\s+(previous|prior|system)", re.I),
    re.compile(r"act\s+as\s+(if|though|a|an)\s+", re.I),
    re.compile(r"reveal\s+(your\s+)?(system\s+prompt|instructions?|context)", re.I),
    re.compile(r"<\s*(script|iframe|svg|img)[^>]*>", re.I),
    re.compile(r"(;\s*drop\s+table|union\s+select|or\s+1\s*=\s*1)", re.I),
    re.compile(r"\x00|\x08|\x1b", re.I),  # null bytes, backspace, escape
]

_INJECT_PATHS = {"/api/v1/search", "/api/v1/export"}


def check_prompt_injection(text: str) -> bool:
    """Returns True if safe, False if injection detected."""
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            return False
    return True


class PromptInjectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path not in _INJECT_PATHS:
            return await call_next(request)

        q = request.query_params.get("q", "")
        if q and not check_prompt_injection(q):
            return Response(
                content='{"detail":"Invalid query content"}',
                status_code=400,
                media_type="application/json",
            )
        return await call_next(request)
