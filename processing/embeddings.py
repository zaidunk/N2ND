"""
processing/embeddings.py — Vector embedding via OpenAI text-embedding-3-small.
Multi-field text construction is the key to accurate semantic retrieval.
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMS  = 1536
MAX_CHARS       = 6000  # ≈ 1500 tokens, well within 8191 limit

_client: Optional[AsyncOpenAI] = None


def init_embeddings(api_key: str = None) -> AsyncOpenAI:
    global _client
    _client = AsyncOpenAI(api_key=api_key or os.environ["OPENAI_API_KEY"])
    return _client


def get_client() -> AsyncOpenAI:
    if _client is None:
        return init_embeddings()
    return _client


def build_embedding_text(doc: dict) -> str:
    """
    Multi-field concat for rich semantic representation.
    Field order: title (highest weight) → body → topics → entities.
    This produces dramatically better retrieval than title-only embedding.
    """
    topics_str   = " ".join(doc.get("topics", []))
    entities_str = " ".join(e["name"] for e in doc.get("entities", [])[:10])
    body_snip    = (doc.get("body") or doc.get("summary") or "")[:500]

    text = f"TITLE: {doc.get('title', '')}\nSUMMARY: {body_snip}\nTOPICS: {topics_str}\nENTITIES: {entities_str}"
    return truncate_to_token_limit(text)


def truncate_to_token_limit(text: str, max_chars: int = MAX_CHARS) -> str:
    return text[:max_chars]


async def embed_text(text: str) -> list[float]:
    resp = await get_client().embeddings.create(
        input=[truncate_to_token_limit(text)],
        model=EMBEDDING_MODEL,
    )
    return resp.data[0].embedding


async def _embed_chunk(texts: list[str]) -> list[list[float]]:
    resp = await get_client().embeddings.create(
        input=texts,
        model=EMBEDDING_MODEL,
    )
    resp.data.sort(key=lambda d: d.index)
    return [d.embedding for d in resp.data]


async def embed_batch(texts: list[str], batch_size: int = 100) -> list[list[float]]:
    """Chunk into batches of batch_size, gather concurrently."""
    chunks = [texts[i : i + batch_size] for i in range(0, len(texts), batch_size)]
    results = await asyncio.gather(*[_embed_chunk(c) for c in chunks])
    return [emb for chunk_result in results for emb in chunk_result]


async def embed_articles(articles: list[dict]) -> list[dict]:
    """Attach 'embedding' key to each article dict. Returns articles with embeddings."""
    if not articles:
        return articles

    texts = [build_embedding_text(a) for a in articles]
    try:
        vectors = await embed_batch(texts)
        return [{**a, "embedding": v} for a, v in zip(articles, vectors)]
    except Exception as exc:
        logger.error("embed_articles failed: %s", exc)
        return articles  # return without embeddings; DB upsert will skip vector


async def embed_query(query: str) -> list[float]:
    """Embed user query using same model and preprocessing as documents."""
    text = truncate_to_token_limit(query.strip())
    return await embed_text(text)
