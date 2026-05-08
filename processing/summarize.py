"""
processing/summarize.py — LiteLLM-powered article summarization.
Generates 2-sentence summaries cached per content_hash (TTL 86400).
Only runs during ingestion, never on the hot query path.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import os

logger = logging.getLogger(__name__)

_MIN_BODY_LEN  = 200   # skip if body already short
_MAX_BODY_CHARS = 3000  # truncate to control token cost
_SUMMARY_TTL   = 86_400
_BATCH_SIZE    = 8     # concurrent LiteLLM calls
_MODEL         = "gpt-4o-mini"  # cheapest, fastest


def _summary_cache_key(content_hash: str) -> str:
    return f"n2nd:summary:{content_hash}"


async def _summarize_one(text: str, lang: str = "id") -> str:
    """Call LiteLLM for a single article. Returns summary string."""
    try:
        from litellm import acompletion

        system = (
            "Kamu adalah asisten ringkasan berita Indonesia. "
            "Buat ringkasan TEPAT 2 kalimat dalam Bahasa Indonesia. "
            "Fokus pada fakta utama dan dampak. Jangan tambahkan opini."
            if lang == "id" else
            "You are a news summarizer. Write EXACTLY 2 sentences in English. "
            "Focus on key facts and impact. No opinions."
        )

        resp = await acompletion(
            model=_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": text[:_MAX_BODY_CHARS]},
            ],
            max_tokens=120,
            temperature=0.2,
        )
        return resp.choices[0].message.content.strip()
    except Exception as exc:
        logger.debug("summarize_one failed: %s", exc)
        # 1) Try Hugging Face summarization API if token present
        hf_token = os.environ.get("HUGGINGFACE_API_TOKEN") or os.environ.get("HF_API_TOKEN")
        if hf_token:
            try:
                import httpx

                hf_model = "sshleifer/distilbart-cnn-12-6"
                url = f"https://api-inference.huggingface.co/models/{hf_model}"
                headers = {"Authorization": f"Bearer {hf_token}", "Accept": "application/json"}
                payload = {"inputs": text[:_MAX_BODY_CHARS], "parameters": {"max_length": 120, "min_length": 30}}
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()
                    out = resp.json()
                    if isinstance(out, list) and out:
                        return out[0].get("summary_text", out[0].get("generated_text", "")).strip()
            except Exception as exc_hf:
                logger.debug("Hugging Face summarization failed: %s", exc_hf)

        # Fallback: simple extractive 2-sentence summary
        try:
            s = text.replace("\n", " ").strip()
            parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+", s) if p.strip()]
            if not parts:
                return s[:200]
            return " ".join(parts[:2])
        except Exception:
            return (text[:200] + "...") if text else ""


async def summarize_batch(articles: list[dict]) -> list[dict]:
    """
    Add 'ai_summary' to each article. Skips if:
    - OPENAI_API_KEY not set
    - body < _MIN_BODY_LEN (already short)
    - cached summary exists in Redis
    """
    if not os.environ.get("OPENAI_API_KEY"):
        return articles

    from processing.cache import cache_get, cache_set

    results = list(articles)
    to_process: list[tuple[int, dict]] = []

    for i, art in enumerate(results):
        body = art.get("body") or art.get("summary") or ""
        if len(body) < _MIN_BODY_LEN:
            continue

        ch = art.get("content_hash") or hashlib.sha256(body[:100].encode()).hexdigest()[:16]
        cached = await cache_get(_summary_cache_key(ch))
        if cached:
            results[i] = {**art, "ai_summary": cached["data"], "content_hash": ch}
        else:
            to_process.append((i, {**art, "_ch": ch}))

    # Process in batches to avoid hammering the API
    for batch_start in range(0, len(to_process), _BATCH_SIZE):
        batch = to_process[batch_start: batch_start + _BATCH_SIZE]
        summaries = await asyncio.gather(
            *[
                _summarize_one(
                    (art.get("body") or art.get("summary") or "")[:_MAX_BODY_CHARS],
                    lang=art.get("lang", "id"),
                )
                for _, art in batch
            ],
            return_exceptions=True,
        )

        for (idx, art), summary in zip(batch, summaries):
            if isinstance(summary, str) and summary:
                ch = art["_ch"]
                await cache_set(_summary_cache_key(ch), summary, _SUMMARY_TTL)
                results[idx] = {**articles[idx], "ai_summary": summary}

    summarized = sum(1 for a in results if a.get("ai_summary"))
    if summarized:
        logger.info("summarize_batch: %d/%d articles summarized", summarized, len(articles))

    return results
