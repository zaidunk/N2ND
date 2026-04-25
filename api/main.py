"""
api/main.py — FastAPI entry point with lifespan initialization.
Reuses data-fetching patterns from surveilencemaxxing, ported to async FastAPI.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from processing.cache import init_redis
from processing.nlp import init_nlp
from processing.embeddings import init_embeddings

logger = logging.getLogger(__name__)

_db_client = None


def get_db_client():
    global _db_client
    if _db_client is None:
        from supabase import create_client
        _db_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _db_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    # Phase 0: Redis
    await init_redis()
    logger.info("Redis initialized")

    # Phase 1: Embeddings client (NLP models lazy-load on first ingest job)
    init_embeddings()
    logger.info("Embeddings client initialized")

    # Phase 2: Pre-init DB client (avoid cold spike on first request)
    get_db_client()
    logger.info("DB client initialized")

    # Phase 3: BPS static data
    from ingestion.bps import load_bps_to_redis
    await load_bps_to_redis()
    logger.info("BPS data loaded to Redis")

    # Phase 4: Scheduler
    from ingestion.scheduler import start_scheduler
    start_scheduler()
    logger.info("Ingestion scheduler started")

    yield

    from ingestion.scheduler import stop_scheduler
    stop_scheduler()
    logger.info("Scheduler stopped")


app = FastAPI(
    title="n2nd API",
    description="Attention Boost — Indonesian Intelligence Data Platform",
    version="0.1.0",
    lifespan=lifespan,
)

_cors_origins = os.environ.get("CORS_ORIGINS", "")
if not _cors_origins or _cors_origins == "*":
    import warnings
    warnings.warn(
        "CORS_ORIGINS not set — defaulting to '*'. Set CORS_ORIGINS in production.",
        stacklevel=2,
    )
    _cors_origins = "*"

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins.split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

from api.routes import feed, search, export, stats, auth  # noqa: E402
from api.middleware.rate_limit import RateLimitMiddleware  # noqa: E402
from api.middleware.injection import PromptInjectionMiddleware  # noqa: E402

app.add_middleware(RateLimitMiddleware)
app.add_middleware(PromptInjectionMiddleware)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = (
        "default-src 'none'; frame-ancestors 'none'"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

app.include_router(feed.router,   prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(export.router, prefix="/api/v1")
app.include_router(stats.router,  prefix="/api/v1")
app.include_router(auth.router,   prefix="/api/v1")


@app.get("/api/v1/health")
async def health():
    from processing.cache import KEY_HEALTH, cache_get
    status = await cache_get(KEY_HEALTH)
    return status["data"] if status else {"status": "UNKNOWN"}


_ADMIN_TOKEN = os.environ.get("ADMIN_API_KEY", "")


def _require_admin(request: Request) -> None:
    if not _ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="Admin access not configured")
    provided = request.headers.get("X-Admin-Key", "")
    import hmac
    if not provided or not hmac.compare_digest(provided, _ADMIN_TOKEN):
        raise HTTPException(status_code=403, detail="Forbidden")


@app.post("/api/v1/refresh/{module}")
async def force_refresh(module: str, request: Request):
    _require_admin(request)

    allowed = {"rss", "market", "crypto", "forex", "bmkg", "gdelt", "bps"}
    if module not in allowed:
        raise HTTPException(status_code=400, detail="Unknown module")

    dispatch = {
        "rss":    lambda: __import__("ingestion.rss",    fromlist=["fetch_all_rss"]).fetch_all_rss(),
        "market": lambda: __import__("ingestion.market", fromlist=["fetch_all_market_signals"]).fetch_all_market_signals(),
        "crypto": lambda: __import__("ingestion.market", fromlist=["fetch_crypto_prices"]).fetch_crypto_prices(),
        "forex":  lambda: __import__("ingestion.market", fromlist=["fetch_latest_forex"]).fetch_latest_forex("USD"),
        "bmkg":   lambda: __import__("ingestion.bmkg",   fromlist=["fetch_bmkg_data"]).fetch_bmkg_data(),
        "gdelt":  lambda: __import__("ingestion.gdelt",  fromlist=["fetch_all_gdelt"]).fetch_all_gdelt(),
        "bps":    lambda: __import__("ingestion.bps",    fromlist=["refresh_bps_weekly"]).refresh_bps_weekly(),
    }
    try:
        await dispatch[module]()
        return {"status": "ok", "module": module}
    except Exception as exc:
        logger.error("force_refresh(%s): %s", module, exc)
        raise HTTPException(status_code=500, detail="Refresh failed")
