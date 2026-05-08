Cloudflare Worker for n2nd — HF Inference proxy

Files:
- `worker.js` — proxy endpoints `/embed` and `/summarize` that forward requests to Hugging Face Inference API.
- `wrangler.toml` — local wrangler config.

Quick deploy:

1. Install Wrangler: `npm install -g wrangler`
2. Login: `wrangler login`
3. Add secret HF token:
   `wrangler secret put HUGGINGFACE_API_TOKEN`
4. Publish:
   `wrangler publish --name n2nd-worker`

Usage:
- POST /embed with JSON `{ "inputs": ["text1", "text2"] }` → returns HF response.
- POST /summarize with JSON `{ "inputs": "long text" }` → returns HF summary.

Notes:
- This Worker proxies requests to HF Inference API; it does not run large models locally. For offline/local models use Worker+WASM approach (advanced).
- Add Cloudflare KV/Rate limiting or Durable Objects for production rate limits and caching.
