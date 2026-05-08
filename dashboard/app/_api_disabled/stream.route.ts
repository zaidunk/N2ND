import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

// ── In-memory cache: 45s per channel ─────────────────────────────────────────
const cache = new Map<string, { videoId: string | null; isLive: boolean; ts: number }>()
const CACHE_TTL = 45_000

// ── Rate limit: 30 req/min per IP ─────────────────────────────────────────────
const rateMap = new Map<string, number[]>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const times = (rateMap.get(ip) ?? []).filter(t => now - t < 60_000)
  if (times.length >= 30) return true
  times.push(now)
  rateMap.set(ip, times)
  return false
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/
const HANDLE_RE   = /^[a-zA-Z0-9][a-zA-Z0-9_.]{0,62}$/
const CHID_RE     = /^[a-zA-Z0-9_-]{1,64}$/

async function fetchLive(handle: string, channelId: string): Promise<string | null> {
  try {
    const r = await fetch(`https://www.youtube.com/@${handle}/live`, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": UA, "Accept-Language": "id-ID,id;q=0.9,en;q=0.8" },
    })
    if (!r.ok) return null
    const html = await r.text()
    const vid =
      html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/)?.[1] ??
      html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)?.[1] ?? null
    if (!vid || !VIDEO_ID_RE.test(vid)) return null
    if (channelId.startsWith("UC") && !html.includes(channelId)) return null
    return vid
  } catch { return null }
}

async function fetchLatest(channelId: string): Promise<string | null> {
  if (!channelId.startsWith("UC")) return null
  try {
    const r = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { signal: AbortSignal.timeout(5000), headers: { "User-Agent": UA } }
    )
    if (!r.ok) return null
    const xml = await r.text()
    const vid = xml.match(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/)?.[1] ?? null
    return vid && VIDEO_ID_RE.test(vid) ? vid : null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (isRateLimited(ip))
    return NextResponse.json({ error: "rate limited" }, { status: 429 })

  const handle    = req.nextUrl.searchParams.get("handle")    ?? ""
  const channelId = req.nextUrl.searchParams.get("channelId") ?? ""

  if (!HANDLE_RE.test(handle) || !CHID_RE.test(channelId))
    return NextResponse.json({ error: "invalid params" }, { status: 400 })

  const cacheKey = `${handle}:${channelId}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL)
    return NextResponse.json({ videoId: cached.videoId, isLive: cached.isLive })

  const liveId = await fetchLive(handle, channelId)
  if (liveId) {
    cache.set(cacheKey, { videoId: liveId, isLive: true, ts: Date.now() })
    return NextResponse.json({ videoId: liveId, isLive: true })
  }

  const latestId = await fetchLatest(channelId)
  cache.set(cacheKey, { videoId: latestId, isLive: false, ts: Date.now() })
  return NextResponse.json({ videoId: latestId, isLive: false })
}
