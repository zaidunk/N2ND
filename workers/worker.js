addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const HF_EMBED_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'
const HF_SUMMARY_MODEL = 'facebook/bart-large-cnn'

const SAMPLE_SEGMENTS = [
  ['urban-planner', 'Urban Planner', '25-34', 'menengah-atas', 'Jakarta', 'Bandung', 'Surabaya', ['LinkedIn', 'X', 'Instagram'], 0.28, 78, 'up', ['transport', 'housing', 'public policy']],
  ['value-hunter', 'Value Hunter', '18-30', 'menengah', 'Bekasi', 'Tangerang', 'Depok', ['TikTok', 'Instagram', 'YouTube'], -0.08, 61, 'flat', ['discount', 'food price', 'payday']],
  ['family-optimizer', 'Family Optimizer', '30-45', 'menengah', 'Semarang', 'Yogyakarta', 'Malang', ['Facebook', 'WhatsApp', 'YouTube'], 0.12, 66, 'up', ['education', 'healthcare', 'household']],
  ['market-watcher', 'Market Watcher', '28-42', 'menengah-atas', 'Jakarta', 'Surabaya', 'Medan', ['X', 'LinkedIn', 'YouTube'], -0.18, 72, 'down', ['rupiah', 'crypto', 'interest rate']],
  ['campus-signal', 'Campus Signal', '18-24', 'menengah', 'Bandung', 'Yogyakarta', 'Malang', ['TikTok', 'X', 'Instagram'], 0.34, 54, 'up', ['scholarship', 'AI tools', 'career']],
]

async function forwardToHF(model, body, token) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const text = await resp.text()
  let json
  try { json = JSON.parse(text) } catch (e) { json = { raw: text } }
  return jsonResponse({ ok: resp.ok, status: resp.status, body: json }, resp.status)
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/$/, '') || '/'

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (path === '/health' && request.method === 'GET') {
    return jsonResponse({
      ok: true,
      huggingface: { tokenConfigured: Boolean(getHfToken(request)), optionalAuth: true },
      endpoints: ['/segments', '/embed', '/summarize'],
    })
  }

  if (path === '/segments' && (request.method === 'GET' || request.method === 'POST')) {
    return jsonResponse(buildSegmentsPayload())
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method not allowed' }, 405)
  }

  let body
  try {
    body = await request.json()
  } catch (e) {
    return jsonResponse({ error: 'invalid json' }, 400)
  }

  if (path === '/embed') {
    const inputs = body.inputs || body.text || body.texts
    if (!inputs) return jsonResponse({ error: 'missing inputs' }, 400)
    return forwardToHF(HF_EMBED_MODEL, { inputs }, getHfToken(request))
  }

  if (path === '/summarize') {
    const inputs = body.inputs || body.text || body.document
    if (!inputs) return jsonResponse({ error: 'missing inputs' }, 400)
    const params = Object.assign({ max_length: 120, min_length: 24 }, body.params || {})
    return forwardToHF(HF_SUMMARY_MODEL, { inputs, parameters: params }, getHfToken(request))
  }

  return jsonResponse({ error: 'not found' }, 404)
}

function getHfToken(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  return bearer ||
    globalThis.HF_TOKEN ||
    globalThis.HF_API_TOKEN ||
    globalThis.HUGGINGFACE_API_TOKEN ||
    globalThis.HUGGINGFACE_API_KEY ||
    ''
}

function buildSegmentsPayload() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 7)

  return {
    generatedAt: today.toISOString(),
    window: { start: start.toISOString(), end: today.toISOString(), newsCount: 128 },
    segments: SAMPLE_SEGMENTS.map(([id, label, ageRange, economyClass, primary, secondary, tertiary, topSocial, toneScore, buyingPower, direction, drivers], index) => ({
      id,
      label,
      ageRange,
      economyClass,
      economyBand: economyClass === 'menengah-atas' ? 'Rp 8-18 juta/bulan' : 'Rp 3-8 juta/bulan',
      domicile: { primary, secondary, tertiary },
      topSocial,
      toneScore,
      toneLabel: toneScore >= 0.2 ? 'positive' : toneScore <= -0.2 ? 'negative' : 'neutral',
      buyingPower,
      trend: { direction, horizonDays: 14, confidence: 0.72 - index * 0.04, score: 0.68 - index * 0.03 },
      drivers,
    })),
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() },
  })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Cache-Control': 'no-store',
  }
}
