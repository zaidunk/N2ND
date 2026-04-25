"""
ingestion/r2.py — Cloudflare R2 raw archive.
Stores raw ingested JSON as {source}/{YYYY-MM-DD}/{content_hash}.json.
Non-fatal: R2 failure never blocks ingestion pipeline.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import date, datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

_s3_client = None


def _get_client():
    global _s3_client
    if _s3_client is not None:
        return _s3_client

    account_id = os.environ.get("R2_ACCOUNT_ID")
    access_key = os.environ.get("R2_ACCESS_KEY_ID")
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")

    if not all([account_id, access_key, secret_key]):
        return None

    import boto3
    _s3_client = boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )
    return _s3_client


def _make_key(source: str, content_hash: str) -> str:
    today = date.today().isoformat()
    return f"{source}/{today}/{content_hash}.json"


def _archive_sync(bucket: str, object_key: str, payload: bytes) -> None:
    client = _get_client()
    if client is None:
        return
    client.put_object(
        Bucket=bucket,
        Key=object_key,
        Body=payload,
        ContentType="application/json",
    )


async def archive_documents(docs: list[dict], source: str) -> None:
    """Fire-and-forget archive of raw docs to R2. Non-fatal."""
    bucket = os.environ.get("R2_BUCKET_NAME", "n2nd-raw")
    if not os.environ.get("R2_ACCOUNT_ID"):
        return  # R2 not configured — skip silently

    import asyncio

    archived = 0
    for doc in docs:
        content_hash = doc.get("content_hash") or doc.get("id")
        if not content_hash:
            continue
        key = _make_key(source, content_hash)
        payload = json.dumps({**doc, "_archived_at": datetime.now(timezone.utc).isoformat()}, default=str).encode()
        try:
            await asyncio.to_thread(_archive_sync, bucket, key, payload)
            archived += 1
        except Exception as exc:
            logger.debug("R2 archive skip (%s): %s", key, exc)

    if archived:
        logger.info("R2 archived %d docs → %s/%s/", archived, bucket, source)
