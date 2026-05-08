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
import asyncio

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
        logger.warning("OpenAI embed_articles failed: %s. Trying Hugging Face Inference API or local fallbacks.", exc)

        # 1) Try Hugging Face Inference API if token provided
        hf_token = os.environ.get("HUGGINGFACE_API_TOKEN") or os.environ.get("HF_API_TOKEN")
        if hf_token:
            try:
                import httpx

                url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
                headers = {"Authorization": f"Bearer {hf_token}", "Accept": "application/json"}
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(url, headers=headers, json={"inputs": texts})
                    resp.raise_for_status()
                    vectors = resp.json()
                    # API may return list of lists or nested dicts
                    vecs = []
                    for item in vectors:
                        if isinstance(item, dict) and "embedding" in item:
                            vecs.append(item["embedding"])
                        elif isinstance(item, list):
                            vecs.append(item)
                        else:
                            # unknown format
                            raise ValueError("Unexpected HF embeddings response format")
                    return [{**a, "embedding": v} for a, v in zip(articles, vecs)]
            except Exception as exc_hf:
                logger.warning("Hugging Face embedding API failed: %s", exc_hf)

        # 2) Try local sentence-transformers
        try:
            from sentence_transformers import SentenceTransformer

            model = SentenceTransformer("all-MiniLM-L6-v2")

            def _encode(texts_list):
                return model.encode(texts_list, show_progress_bar=False, convert_to_numpy=True)

            vectors = await asyncio.to_thread(_encode, texts)

            # vectors may be a numpy array or an iterable of arrays
            try:
                import numpy as _np

                if isinstance(vectors, _np.ndarray):
                    vecs = vectors.tolist()
                else:
                    vecs = [v.tolist() if hasattr(v, "tolist") else list(v) for v in vectors]
            except Exception:
                vecs = [v.tolist() if hasattr(v, "tolist") else list(v) for v in vectors]

            return [{**a, "embedding": v} for a, v in zip(articles, vecs)]
        except Exception as exc2:
            logger.warning("Local sentence-transformers unavailable or failed: %s. Trying TF-IDF fallback.", exc2)

        # 3) TF-IDF fallback
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer

            def compute_tfidf(texts):
                vec = TfidfVectorizer(max_features=512)
                m = vec.fit_transform(texts)
                arr = m.toarray()
                return [a.tolist() for a in arr]

            vecs = await asyncio.to_thread(compute_tfidf, texts)
            return [{**a, "embedding": v} for a, v in zip(articles, vecs)]
        except Exception as exc3:
            logger.warning("TF-IDF fallback failed: %s. Using deterministic hashing fallback.", exc3)

        # 4) Deterministic hashing fallback
        try:
            import hashlib

            def hash_embed(s: str, dims: int = 128):
                v = []
                for i in range(dims):
                    h = hashlib.sha256((s + str(i)).encode()).hexdigest()
                    val = int(h[:8], 16)
                    v.append((val % 10000) / 10000.0)
                return v

            vecs = [hash_embed(t) for t in texts]
            return [{**a, "embedding": v} for a, v in zip(articles, vecs)]
        except Exception as exc4:
            logger.error("Deterministic hashing fallback failed: %s", exc4)
            return articles  # return without embeddings; DB upsert will skip vector


async def embed_query(query: str) -> list[float]:
    """Embed user query using same model and preprocessing as documents."""
    text = truncate_to_token_limit(query.strip())
    return await embed_text(text)
