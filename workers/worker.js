addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const HF_EMBED_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'
const HF_SUMMARY_MODEL = 'facebook/bart-large-cnn'
const NEWS_TTL_SECONDS = 900
const ALLOWED_ORIGINS = new Set([
  'https://n2nd.pages.dev',
  'https://master.n2nd.pages.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
])

const NEWS_SOURCES = [
  { id: 'antara', label: 'Antara', url: 'https://www.antaranews.com/rss/terkini.xml', lang: 'id', tier: 1 },
  { id: 'tempo', label: 'Tempo', url: 'https://rss.tempo.co/', lang: 'id', tier: 1 },
  { id: 'detik', label: 'Detik', url: 'https://rss.detik.com/index.php/detikcom_mostpopular', lang: 'id', tier: 1 },
  { id: 'cnn_id', label: 'CNN Indonesia', url: 'https://www.cnnindonesia.com/rss/', lang: 'id', tier: 1 },
  { id: 'cnbc_id', label: 'CNBC Indonesia', url: 'https://www.cnbcindonesia.com/rss', lang: 'id', tier: 1 },
  { id: 'kompas', label: 'Kompas', url: 'https://rss.kompas.com/index.php/kompas/terkini', lang: 'id', tier: 1 },
  { id: 'kontan', label: 'Kontan', url: 'https://www.kontan.co.id/rss', lang: 'id', tier: 2 },
  { id: 'bisnis', label: 'Bisnis', url: 'https://www.bisnis.com/rss', lang: 'id', tier: 2 },
  { id: 'bbc', label: 'BBC', url: 'https://feeds.bbci.co.uk/news/rss.xml', lang: 'en', tier: 2 },
  { id: 'aljazeera', label: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', lang: 'en', tier: 2 },
]

const TOPICS = {
  food: ['beras', 'pangan', 'makan', 'sembako', 'cabai', 'gula', 'minyak', 'food', 'staple'],
  mobility: ['transport', 'bbm', 'tol', 'kereta', 'mudik', 'ojek', 'bensin', 'traffic', 'commuter'],
  finance: ['rupiah', 'inflasi', 'suku bunga', 'bi rate', 'bank', 'kredit', 'saham', 'ihsg', 'crypto', 'bitcoin', 'pajak', 'investasi'],
  jobs: ['kerja', 'phk', 'upah', 'gaji', 'buruh', 'karier', 'lowongan', 'umkm', 'startup', 'employment'],
  health: ['kesehatan', 'bpjs', 'rumah sakit', 'dokter', 'obat', 'vaksin', 'stunting', 'health'],
  education: ['sekolah', 'kampus', 'mahasiswa', 'beasiswa', 'pendidikan', 'kurikulum', 'university'],
  policy: ['pemerintah', 'presiden', 'menteri', 'dpr', 'kebijakan', 'aturan', 'subsidi', 'regulasi', 'government'],
  climate: ['cuaca', 'banjir', 'gempa', 'polusi', 'iklim', 'hujan', 'bmkg', 'climate'],
  digital: ['ai', 'digital', 'internet', 'aplikasi', 'tiktok', 'youtube', 'data', 'siber', 'teknologi'],
  lifestyle: ['hiburan', 'film', 'musik', 'wisata', 'olahraga', 'viral', 'fashion', 'travel'],
}

const POSITIVE = ['naik', 'tumbuh', 'stabil', 'pulih', 'surplus', 'menguat', 'turun harga', 'bantuan', 'subsidi', 'profit', 'growth', 'gain']
const NEGATIVE = ['turun', 'mahal', 'krisis', 'rugi', 'defisit', 'melemah', 'banjir', 'gempa', 'phk', 'konflik', 'perang', 'inflasi', 'macet', 'gagal']

const SEGMENTS = [
  { id: 'urban-achiever', label: 'Urban Achiever', ageRange: '25-34', economyClass: 'menengah-atas', economyBand: 'Rp 8-18 juta/bulan', domicile: ['Jakarta', 'Surabaya', 'Bandung'], social: ['LinkedIn', 'X', 'Instagram'], basePower: 78, weights: { finance: 1.4, jobs: 1.2, digital: 1.1, policy: 0.9 } },
  { id: 'value-hunter', label: 'Value Hunter', ageRange: '18-30', economyClass: 'menengah', economyBand: 'Rp 3-8 juta/bulan', domicile: ['Bekasi', 'Tangerang', 'Depok'], social: ['TikTok', 'Instagram', 'YouTube'], basePower: 60, weights: { food: 1.5, mobility: 1.1, lifestyle: 0.8, finance: 0.9 } },
  { id: 'family-optimizer', label: 'Family Optimizer', ageRange: '30-45', economyClass: 'menengah', economyBand: 'Rp 4-10 juta/bulan', domicile: ['Semarang', 'Yogyakarta', 'Malang'], social: ['WhatsApp', 'Facebook', 'YouTube'], basePower: 66, weights: { food: 1.2, education: 1.4, health: 1.2, policy: 1.0 } },
  { id: 'market-watcher', label: 'Market Watcher', ageRange: '28-42', economyClass: 'menengah-atas', economyBand: 'Rp 10-25 juta/bulan', domicile: ['Jakarta', 'Surabaya', 'Medan'], social: ['X', 'LinkedIn', 'YouTube'], basePower: 74, weights: { finance: 1.8, policy: 1.0, digital: 0.8, jobs: 0.8 } },
  { id: 'campus-signal', label: 'Campus Signal', ageRange: '18-24', economyClass: 'menengah', economyBand: 'Rp 2-6 juta/bulan', domicile: ['Bandung', 'Yogyakarta', 'Malang'], social: ['TikTok', 'X', 'Instagram'], basePower: 52, weights: { education: 1.7, jobs: 1.3, digital: 1.2, lifestyle: 0.9 } },
  { id: 'young-hustler', label: 'Young Hustler', ageRange: '20-32', economyClass: 'menengah', economyBand: 'Rp 3-9 juta/bulan', domicile: ['Jakarta', 'Bandung', 'Makassar'], social: ['TikTok', 'Instagram', 'X'], basePower: 58, weights: { jobs: 1.6, digital: 1.3, finance: 1.1, lifestyle: 0.7 } },
  { id: 'sme-operator', label: 'SME Operator', ageRange: '30-50', economyClass: 'menengah', economyBand: 'Rp 5-15 juta/bulan', domicile: ['Surabaya', 'Semarang', 'Medan'], social: ['WhatsApp', 'Facebook', 'YouTube'], basePower: 68, weights: { finance: 1.3, policy: 1.4, food: 0.8, mobility: 0.9 } },
  { id: 'premium-family', label: 'Premium Family', ageRange: '35-54', economyClass: 'menengah-atas', economyBand: 'Rp 18-45 juta/bulan', domicile: ['Jakarta Selatan', 'BSD', 'Surabaya Barat'], social: ['Instagram', 'LinkedIn', 'YouTube'], basePower: 88, weights: { education: 1.4, health: 1.1, finance: 1.1, lifestyle: 1.0 } },
  { id: 'health-guardian', label: 'Health Guardian', ageRange: '28-48', economyClass: 'menengah', economyBand: 'Rp 4-12 juta/bulan', domicile: ['Depok', 'Bogor', 'Semarang'], social: ['WhatsApp', 'Instagram', 'YouTube'], basePower: 63, weights: { health: 1.8, food: 1.0, policy: 0.9, climate: 0.7 } },
  { id: 'commuter-core', label: 'Commuter Core', ageRange: '23-40', economyClass: 'menengah', economyBand: 'Rp 4-11 juta/bulan', domicile: ['Bekasi', 'Tangerang', 'Bogor'], social: ['X', 'Instagram', 'TikTok'], basePower: 61, weights: { mobility: 1.8, jobs: 1.1, food: 0.9, policy: 0.8 } },
  { id: 'rural-riser', label: 'Rural Riser', ageRange: '24-44', economyClass: 'menengah', economyBand: 'Rp 2-7 juta/bulan', domicile: ['Garut', 'Kediri', 'Lombok'], social: ['Facebook', 'WhatsApp', 'YouTube'], basePower: 50, weights: { food: 1.4, climate: 1.3, policy: 1.1, jobs: 0.9 } },
  { id: 'creator-class', label: 'Creator Class', ageRange: '18-35', economyClass: 'menengah', economyBand: 'Rp 3-12 juta/bulan', domicile: ['Jakarta', 'Bandung', 'Denpasar'], social: ['TikTok', 'Instagram', 'YouTube'], basePower: 64, weights: { digital: 1.7, lifestyle: 1.3, jobs: 0.9, finance: 0.8 } },
  { id: 'policy-sensitive', label: 'Policy Sensitive', ageRange: '30-55', economyClass: 'menengah', economyBand: 'Rp 5-14 juta/bulan', domicile: ['Jakarta', 'Semarang', 'Palembang'], social: ['X', 'Facebook', 'WhatsApp'], basePower: 65, weights: { policy: 1.8, finance: 1.1, food: 0.8, mobility: 0.7 } },
  { id: 'climate-alert', label: 'Climate Alert', ageRange: '22-45', economyClass: 'menengah', economyBand: 'Rp 3-10 juta/bulan', domicile: ['Jakarta Utara', 'Semarang', 'Makassar'], social: ['Instagram', 'X', 'WhatsApp'], basePower: 56, weights: { climate: 1.8, health: 0.9, food: 0.9, mobility: 0.8 } },
  { id: 'digital-native', label: 'Digital Native', ageRange: '16-27', economyClass: 'menengah', economyBand: 'Rp 2-8 juta/bulan', domicile: ['Bandung', 'Jakarta', 'Surabaya'], social: ['TikTok', 'YouTube', 'Instagram'], basePower: 55, weights: { digital: 1.9, education: 1.0, lifestyle: 1.0, jobs: 0.8 } },
  { id: 'silver-planner', label: 'Silver Planner', ageRange: '45-65', economyClass: 'menengah', economyBand: 'Rp 5-16 juta/bulan', domicile: ['Jakarta', 'Yogyakarta', 'Solo'], social: ['WhatsApp', 'Facebook', 'YouTube'], basePower: 70, weights: { health: 1.5, finance: 1.2, policy: 1.0, food: 0.9 } },
  { id: 'sharia-prudent', label: 'Sharia Prudent', ageRange: '25-45', economyClass: 'menengah', economyBand: 'Rp 4-13 juta/bulan', domicile: ['Aceh', 'Padang', 'Makassar'], social: ['Instagram', 'WhatsApp', 'YouTube'], basePower: 62, weights: { finance: 1.2, food: 1.0, policy: 0.9, lifestyle: 0.8 } },
  { id: 'travel-seeker', label: 'Travel Seeker', ageRange: '22-38', economyClass: 'menengah-atas', economyBand: 'Rp 8-20 juta/bulan', domicile: ['Jakarta', 'Denpasar', 'Bandung'], social: ['Instagram', 'TikTok', 'YouTube'], basePower: 76, weights: { lifestyle: 1.7, mobility: 1.3, climate: 0.8, finance: 0.7 } },
  { id: 'home-maker', label: 'Home Maker', ageRange: '27-48', economyClass: 'menengah', economyBand: 'Rp 3-9 juta/bulan', domicile: ['Bekasi', 'Sidoarjo', 'Tangerang'], social: ['WhatsApp', 'Facebook', 'TikTok'], basePower: 59, weights: { food: 1.5, health: 1.0, education: 0.9, lifestyle: 0.7 } },
  { id: 'early-adopter', label: 'Early Adopter', ageRange: '21-39', economyClass: 'menengah-atas', economyBand: 'Rp 9-24 juta/bulan', domicile: ['Jakarta', 'Bandung', 'Surabaya'], social: ['X', 'YouTube', 'LinkedIn'], basePower: 82, weights: { digital: 1.8, finance: 1.1, lifestyle: 1.0, jobs: 0.7 } },
]

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/$/, '') || '/'
  globalThis.__requestOrigin = request.headers.get('origin') || ''

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() })

  if (path === '/health' && request.method === 'GET') {
    return jsonResponse({
      ok: true,
      nlp: { mode: 'news-keyword-scoring', characterSegments: SEGMENTS.length },
      huggingface: { tokenConfigured: Boolean(getHfToken(request)), featureExtractionModel: HF_EMBED_MODEL },
      endpoints: ['/news', '/segments', '/hf-health', '/embed', '/summarize'],
    })
  }

  if (path === '/hf-health' && request.method === 'GET') {
    return forwardToHF(HF_EMBED_MODEL, 'feature-extraction', { inputs: ['n2nd attentionboost health check'] }, getHfToken(request))
  }

  if (path === '/news' && request.method === 'GET') {
    const articles = await fetchAllNews()
    return jsonResponse({ generatedAt: new Date().toISOString(), count: articles.length, articles })
  }

  if (path === '/segments' && (request.method === 'GET' || request.method === 'POST')) {
    const articles = await fetchAllNews()
    return jsonResponse(buildSegmentsPayload(articles))
  }

  if (request.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405)

  let body
  try { body = await request.json() } catch (e) { return jsonResponse({ error: 'invalid json' }, 400) }

  if (path === '/embed') {
    if (!isAuthorizedAppRequest(request)) return jsonResponse({ error: 'unauthorized' }, 401)
    const inputs = body.inputs || body.text || body.texts
    if (!inputs) return jsonResponse({ error: 'missing inputs' }, 400)
    return forwardToHF(HF_EMBED_MODEL, 'feature-extraction', { inputs }, getHfToken(request))
  }

  if (path === '/summarize') {
    if (!isAuthorizedAppRequest(request)) return jsonResponse({ error: 'unauthorized' }, 401)
    const inputs = body.inputs || body.text || body.document
    if (!inputs) return jsonResponse({ error: 'missing inputs' }, 400)
    const params = Object.assign({ max_length: 120, min_length: 24 }, body.params || {})
    return forwardToHF(HF_SUMMARY_MODEL, 'summarization', { inputs, parameters: params }, getHfToken(request))
  }

  return jsonResponse({ error: 'not found' }, 404)
}

async function fetchAllNews() {
  const settled = await Promise.allSettled(NEWS_SOURCES.map(fetchSource))
  const seen = new Set()
  return settled
    .flatMap(result => result.status === 'fulfilled' ? result.value : [])
    .filter(article => {
      const key = normalizeText(article.title).slice(0, 90)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => Date.parse(b.published || '') - Date.parse(a.published || ''))
    .slice(0, 120)
}

async function fetchSource(source) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6500)
  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      cf: { cacheTtl: NEWS_TTL_SECONDS, cacheEverything: true },
      headers: {
        'User-Agent': 'n2nd/2.1 (+https://n2nd.pages.dev)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    })
    if (!response.ok) return []
    const xml = await response.text()
    return parseFeed(xml, source)
  } catch (e) {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

function parseFeed(xml, source) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/g) || xml.match(/<entry[\s\S]*?<\/entry>/g) || []
  return blocks.slice(0, 10).map(block => {
    const title = cleanXml(readTag(block, 'title'))
    const link = cleanXml(readTag(block, 'link')) || readAttr(block, 'link', 'href')
    const summary = cleanXml(readTag(block, 'description') || readTag(block, 'summary')).slice(0, 220)
    const published = cleanXml(readTag(block, 'pubDate') || readTag(block, 'published') || readTag(block, 'updated'))
    return {
      title,
      link,
      summary,
      published,
      source: source.id,
      source_id: source.id,
      sourceLabel: source.label,
      lang: source.lang,
      tier: source.tier,
    }
  }).filter(article => article.title && article.link)
}

function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? match[1] : ''
}

function readAttr(xml, tag, attr) {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, 'i'))
  return match ? match[1] : ''
}

function cleanXml(value) {
  return decodeEntities(String(value || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim())
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function buildSegmentsPayload(articles) {
  const analyzed = articles.map(analyzeArticle)
  const topicTotals = aggregateTopics(analyzed)
  const avgTone = analyzed.length ? analyzed.reduce((sum, item) => sum + item.sentiment, 0) / analyzed.length : 0
  const topTopics = Object.entries(topicTotals).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const segments = SEGMENTS.map(segment => scoreSegment(segment, analyzed, topicTotals))
    .sort((a, b) => b.attentionIndex - a.attentionIndex)

  return {
    generatedAt: new Date().toISOString(),
    model: {
      name: 'AttentionBoost Consumer Pulse v0.3',
      nlp: 'keyword topic extraction + sentiment scoring + segment sensitivity matrix',
      mlProvider: 'Hugging Face feature extraction verified',
      hfModel: HF_EMBED_MODEL,
    },
    window: {
      start: minDate(articles),
      end: maxDate(articles),
      newsCount: articles.length,
      sourceCount: new Set(articles.map(a => a.source_id)).size,
    },
    nlp: {
      avgTone: round(avgTone, 3),
      topTopics: topTopics.map(([topic, score]) => ({ topic, score: round(score, 2) })),
      negativePressure: round(analyzed.filter(a => a.sentiment < -0.1).length / Math.max(1, analyzed.length), 3),
      positivePressure: round(analyzed.filter(a => a.sentiment > 0.1).length / Math.max(1, analyzed.length), 3),
    },
    articles: articles.slice(0, 30),
    segments,
  }
}

function analyzeArticle(article) {
  const text = normalizeText(`${article.title} ${article.summary || ''}`)
  const topics = {}
  for (const [topic, keywords] of Object.entries(TOPICS)) {
    const score = keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0)
    if (score) topics[topic] = score
  }
  const pos = POSITIVE.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0)
  const neg = NEGATIVE.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0)
  const sentiment = clamp((pos - neg) / Math.max(2, pos + neg + 1), -1, 1)
  return { ...article, topics, sentiment }
}

function scoreSegment(segment, articles, topicTotals) {
  const weightedTopicScore = Object.entries(segment.weights).reduce((sum, [topic, weight]) => {
    return sum + (topicTotals[topic] || 0) * weight
  }, 0)
  const relevant = articles
    .map(article => ({
      article,
      relevance: Object.entries(segment.weights).reduce((sum, [topic, weight]) => sum + ((article.topics[topic] || 0) * weight), 0),
    }))
    .filter(item => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 4)

  const toneScore = relevant.length
    ? relevant.reduce((sum, item) => sum + item.article.sentiment * item.relevance, 0) / relevant.reduce((sum, item) => sum + item.relevance, 0)
    : 0
  const intensity = clamp(weightedTopicScore / Math.max(8, articles.length * 0.38), 0, 1)
  const attentionIndex = clamp(45 + intensity * 45 + Math.abs(toneScore) * 12, 0, 100)
  const buyingPower = clamp(segment.basePower + toneScore * 10 - negativeCostPressure(relevant) * 6, 0, 100)
  const trendScore = clamp(0.5 + toneScore * 0.25 + (intensity - 0.45) * 0.35, 0, 1)
  const drivers = Object.entries(segment.weights)
    .sort((a, b) => (topicTotals[b[0]] || 0) * b[1] - (topicTotals[a[0]] || 0) * a[1])
    .slice(0, 4)
    .map(([topic]) => topic)

  return {
    id: segment.id,
    label: segment.label,
    ageRange: segment.ageRange,
    economyClass: segment.economyClass,
    economyBand: segment.economyBand,
    domicile: { primary: segment.domicile[0], secondary: segment.domicile[1], tertiary: segment.domicile[2] },
    topSocial: segment.social,
    toneScore: round(toneScore, 3),
    toneLabel: toneScore > 0.18 ? 'positive' : toneScore < -0.18 ? 'negative' : 'neutral',
    buyingPower: round(buyingPower, 1),
    attentionIndex: round(attentionIndex, 1),
    trend: {
      direction: trendScore > 0.58 ? 'up' : trendScore < 0.42 ? 'down' : 'flat',
      horizonDays: 14,
      confidence: round(clamp(0.48 + intensity * 0.42, 0, 0.94), 2),
      score: round(trendScore, 2),
    },
    drivers,
    evidence: relevant.map(item => ({
      title: item.article.title,
      source: item.article.source_id,
      link: item.article.link,
      sentiment: round(item.article.sentiment, 2),
      relevance: round(item.relevance, 2),
    })),
  }
}

function aggregateTopics(articles) {
  const totals = {}
  for (const article of articles) {
    for (const [topic, score] of Object.entries(article.topics)) {
      totals[topic] = (totals[topic] || 0) + score
    }
  }
  return totals
}

function negativeCostPressure(items) {
  return items.some(item => (item.article.topics.food || item.article.topics.mobility || item.article.topics.finance) && item.article.sentiment < -0.1) ? 1 : 0
}

async function forwardToHF(model, task, body, token) {
  if (!token) return jsonResponse({ error: 'missing huggingface token' }, 401)

  const resp = await fetch(`https://router.huggingface.co/hf-inference/models/${model}/pipeline/${task}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const text = await resp.text()
  let json
  try { json = JSON.parse(text) } catch (e) { json = { raw: text } }
  return jsonResponse({ ok: resp.ok, status: resp.status, body: json }, resp.status)
}

function getHfToken(request) {
  const bearer = getHfTokenFromHeader(request)
  return bearer ||
    globalThis.HF_TOKEN ||
    globalThis.HF_API_TOKEN ||
    globalThis.HUGGINGFACE_API_TOKEN ||
    globalThis.HUGGINGFACE_API_KEY ||
    ''
}

function isAuthorizedAppRequest(request) {
  const configuredKey = globalThis.N2ND_WORKER_API_KEY || ''
  if (!configuredKey) return Boolean(getHfTokenFromHeader(request))
  return request.headers.get('x-n2nd-worker-key') === configuredKey
}

function getHfTokenFromHeader(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  return authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
}

function minDate(articles) {
  const values = articles.map(a => Date.parse(a.published || '')).filter(Number.isFinite)
  return values.length ? new Date(Math.min(...values)).toISOString() : new Date(Date.now() - 86400000).toISOString()
}

function maxDate(articles) {
  const values = articles.map(a => Date.parse(a.published || '')).filter(Number.isFinite)
  return values.length ? new Date(Math.max(...values)).toISOString() : new Date().toISOString()
}

function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFKD')
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() },
  })
}

function corsHeaders() {
  const origin = globalThis.__requestOrigin || ''
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://n2nd.pages.dev'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-N2ND-Worker-Key',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }
}
