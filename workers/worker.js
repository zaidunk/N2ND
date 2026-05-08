addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const HF_EMBED_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'
const HF_SUMMARY_MODEL = 'facebook/bart-large-cnn'

async function forwardToHF(model, body, token) {
  const url = `https://api-inference.huggingface.co/models/${model}`
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body),
  })

  const text = await resp.text()
  let json
  try { json = JSON.parse(text) } catch(e) { json = { raw: text } }
  return new Response(JSON.stringify({ status: resp.status, body: json }), {
    status: resp.status,
    headers: { 'Content-Type': 'application/json' }
  })
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/$/, '')

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  // simple health
  if (path === '/health' && request.method === 'GET') {
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // require POST for operations
  if (request.method !== 'POST') {
    return new Response('method not allowed', { status: 405 })
  }

  // Priority: Authorization header (Bearer token) -> Worker binding vars -> globalThis
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  const hfToken = bearer || HF_TOKEN || HUGGINGFACE_API_TOKEN || HUGGINGFACE_API_KEY || null
  if (!hfToken && !globalThis.HF_TOKEN) {
    return new Response(JSON.stringify({ error: 'missing HF token' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  let body
  try {
    body = await request.json()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  if (path === '/embed') {
    // HF sentence-transformers expects inputs: array|string
    const inputs = body.inputs || body.text || body.texts
    if (!inputs) return new Response(JSON.stringify({ error: 'missing inputs' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    return forwardToHF(HF_EMBED_MODEL, { inputs }, hfToken)
  }

  if (path === '/summarize') {
    const inputs = body.inputs || body.text || body.document
    if (!inputs) return new Response(JSON.stringify({ error: 'missing inputs' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    // configure summarization options if provided
    const params = Object.assign({}, body.params || {})
    return forwardToHF(HF_SUMMARY_MODEL, { inputs, parameters: params }, hfToken)
  }

  return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  }
}
