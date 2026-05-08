import Link from "next/link"

export const revalidate = 900

type JsonMap = Record<string, unknown>

type SegmentView = {
  id: string
  label: string
  ageRange?: string
  economyClass?: "menengah" | "menengah-atas"
  economyBand?: string
  domicile?: { primary?: string; secondary?: string; tertiary?: string }
  topSocial?: string[]
  toneScore?: number
  toneLabel?: string
  buyingPower?: number
  trend?: { direction?: string; horizonDays?: number; confidence?: number; score?: number }
  drivers?: string[]
}

type PayloadView = {
  generatedAt?: string
  window?: { start?: string; end?: string; newsCount?: number }
  segments: SegmentView[]
}

const asMap = (v: unknown): JsonMap | null => (v && typeof v === "object" && !Array.isArray(v)) ? v as JsonMap : null
const asString = (v: unknown): string | undefined => typeof v === "string" ? v : undefined
const asNumber = (v: unknown): number | undefined => (typeof v === "number" && isFinite(v)) ? v : undefined
const asArray = (v: unknown): unknown[] => Array.isArray(v) ? v : []
const ATTENTIONBOOST_FALLBACK_URL = "https://n2nd-worker.xolvoncollective.workers.dev/segments"

const pickString = (obj: JsonMap, keys: string[]): string | undefined => {
  for (const key of keys) {
    const val = asString(obj[key])
    if (val) return val
  }
  return undefined
}

const pickNumber = (obj: JsonMap, keys: string[]): number | undefined => {
  for (const key of keys) {
    const val = asNumber(obj[key])
    if (val != null) return val
  }
  return undefined
}

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v))

const toneFromScore = (score?: number): string | undefined => {
  if (score == null) return undefined
  if (score >= 0.35) return "positive"
  if (score <= -0.35) return "negative"
  return "neutral"
}

const formatDate = (value?: string) => {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toISOString().slice(0, 10)
}

async function fetchAttentionBoost(): Promise<PayloadView | null> {
  const endpoint = process.env.ATTENTIONBOOST_API_URL || ATTENTIONBOOST_FALLBACK_URL

  const headers: Record<string, string> = { "User-Agent": "n2nd/2.0" }
  const token = process.env.ATTENTIONBOOST_API_KEY
  if (token) headers.Authorization = `Bearer ${token}`

  const r = await fetch(endpoint, { headers, next: { revalidate: 900 } })
  if (!r.ok) return null
  const raw = await r.json() as JsonMap

  const root = asMap(raw) ?? {}
  const windowRaw = asMap(root.window) ?? asMap(root.batch) ?? null
  const window = windowRaw ? {
    start: asString(windowRaw.start ?? windowRaw.from ?? windowRaw.begin),
    end: asString(windowRaw.end ?? windowRaw.to ?? windowRaw.until),
    newsCount: asNumber(windowRaw.news_count ?? windowRaw.newsCount ?? windowRaw.count),
  } : {
    start: asString(root.start ?? root.from ?? root.date),
    end: asString(root.end ?? root.to ?? root.date),
    newsCount: asNumber(root.news_count ?? root.newsCount ?? root.count),
  }

  const segmentsRaw = asArray(root.segments ?? root.characters ?? root.groups ?? root.data)
    .map((item) => asMap(item))
    .filter((item): item is JsonMap => item != null)

  const segments = segmentsRaw.map((seg, idx): SegmentView => {
    const domicileRaw = asMap(seg.domicile) ?? asMap(seg.city) ?? null
    const primary = domicileRaw ? asString(domicileRaw.primary ?? domicileRaw.first ?? domicileRaw.main) : asString(seg.first_city ?? seg.primary_city)
    const secondary = domicileRaw ? asString(domicileRaw.secondary ?? domicileRaw.second) : asString(seg.second_city ?? seg.secondary_city)
    const tertiary = domicileRaw ? asString(domicileRaw.tertiary ?? domicileRaw.third) : asString(seg.third_city ?? seg.tertiary_city)

    const economyClassRaw = pickString(seg, ["economy_class", "economyClass", "economy", "economic_class"])?.toLowerCase()
    const economyClass = economyClassRaw === "menengah-atas" || economyClassRaw === "upper-middle"
      ? "menengah-atas"
      : economyClassRaw ? "menengah" : undefined

    const topSocialRaw = asArray(seg.top_social ?? seg.social_top3 ?? seg.social_media ?? seg.top_media)
      .map((v) => asString(v))
      .filter((v): v is string => !!v)
      .slice(0, 3)

    const toneScore = pickNumber(seg, ["tone_score", "toneScore", "sentiment", "tone"])
    const toneLabel = pickString(seg, ["tone_label", "toneLabel"]) ?? toneFromScore(toneScore)

    const trendRaw = asMap(seg.trend) ?? asMap(seg.ml_trend) ?? null
    const trend = trendRaw ? {
      direction: pickString(trendRaw, ["direction", "dir", "trend"]),
      horizonDays: pickNumber(trendRaw, ["horizon_days", "horizonDays", "window"]),
      confidence: pickNumber(trendRaw, ["confidence", "score", "strength"]),
      score: pickNumber(trendRaw, ["score", "value"]),
    } : {
      direction: pickString(seg, ["trend_direction", "trend"]),
      horizonDays: pickNumber(seg, ["trend_days", "trend_horizon"]),
      confidence: pickNumber(seg, ["trend_confidence"]),
      score: pickNumber(seg, ["trend_score"]),
    }

    return {
      id: pickString(seg, ["id", "segment_id", "code"]) ?? `seg-${idx + 1}`,
      label: pickString(seg, ["label", "name", "title", "character"]) ?? `Segment ${idx + 1}`,
      ageRange: pickString(seg, ["age_range", "ageRange", "age"]) ?? undefined,
      economyClass,
      economyBand: pickString(seg, ["economy_band", "economyBand", "income_range"]),
      domicile: { primary, secondary, tertiary },
      topSocial: topSocialRaw.length ? topSocialRaw : undefined,
      toneScore,
      toneLabel,
      buyingPower: pickNumber(seg, ["buying_power", "buyingPower", "power_index", "buying_power_index"]),
      trend,
      drivers: asArray(seg.drivers ?? seg.signals).map((v) => asString(v)).filter((v): v is string => !!v),
    }
  })

  return {
    generatedAt: asString(root.generated_at ?? root.generatedAt ?? root.updated_at),
    window,
    segments,
  }
}

const badgeForTone = (label?: string) => {
  switch (label) {
    case "positive": return "badge-green"
    case "negative": return "badge-red"
    default: return "badge-blue"
  }
}

const trendLabel = (trend?: SegmentView["trend"]) => {
  if (!trend) return ""
  const dir = trend.direction
  if (!dir) return ""
  if (dir.toLowerCase().includes("up")) return "up"
  if (dir.toLowerCase().includes("down")) return "down"
  if (dir.toLowerCase().includes("flat")) return "flat"
  return dir
}

export default async function AttentionBoostPage() {
  const payload = await fetchAttentionBoost()
  const segments = payload?.segments ?? []

  const windowStart = formatDate(payload?.window?.start)
  const windowEnd = formatDate(payload?.window?.end)
  const windowLabel = [windowStart, windowEnd].filter(Boolean).join(" to ")

  const avgTone = segments.map(s => s.toneScore).filter((v): v is number => v != null)
  const avgToneVal = avgTone.length ? avgTone.reduce((a, b) => a + b, 0) / avgTone.length : null

  const avgPower = segments.map(s => s.buyingPower).filter((v): v is number => v != null)
  const avgPowerVal = avgPower.length ? avgPower.reduce((a, b) => a + b, 0) / avgPower.length : null

  const countMid = segments.filter(s => s.economyClass === "menengah").length
  const countUpper = segments.filter(s => s.economyClass === "menengah-atas").length

  const trendTop = segments
    .filter(s => s.trend && s.trend.direction && (s.trend.score != null || s.trend.confidence != null))
    .map(s => ({
      id: s.id,
      label: s.label,
      direction: trendLabel(s.trend),
      score: s.trend?.score ?? s.trend?.confidence ?? null,
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5)

  return (
    <div className="min-h-screen pb-12">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-20 right-0 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.22),transparent_60%)] blur-2xl" />
          <div className="absolute -bottom-20 left-0 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.18),transparent_60%)] blur-2xl" />
        </div>
        <div className="mx-auto max-w-[1200px] px-4 py-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted">AttentionBoost</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-text">Consumer Behavior Matrix</h1>
              <p className="mt-2 text-[12px] text-muted">
                Dampak tone berita harian ke 20 karakter konsumen Indonesia.
              </p>
            </div>
            <Link href="/" className="text-[11px] text-muted hover:text-text border border-border px-3 py-1.5 rounded-full">
              Back to workspace
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="card p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Batch window</p>
              {windowLabel && (
                <p className="mt-1 text-[12px] text-text">{windowLabel}</p>
              )}
              {payload?.window?.newsCount != null && (
                <p className="text-[10px] text-muted mt-1">News: {payload.window.newsCount}</p>
              )}
            </div>
            <div className="card p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Segments</p>
              <p className="mt-1 text-[12px] text-text">{segments.length} active</p>
              {(countMid > 0 || countUpper > 0) && (
                <p className="text-[10px] text-muted mt-1">Menengah: {countMid} | Menengah-atas: {countUpper}</p>
              )}
            </div>
            <div className="card p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Pulse</p>
              {avgToneVal != null && (
                <p className="mt-1 text-[12px] text-text">Avg tone: {avgToneVal.toFixed(2)}</p>
              )}
              {avgPowerVal != null && (
                <p className="text-[10px] text-muted mt-1">Avg power: {avgPowerVal.toFixed(1)}</p>
              )}
            </div>
          </div>

          {trendTop.length > 0 && (
            <div className="mt-4 card p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Top 5 trend direction</p>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
                {trendTop.map((t) => (
                  <div key={t.id} className="rounded-lg border border-border bg-surface2/40 px-2 py-1.5">
                    <p className="text-[10px] font-bold text-text line-clamp-1">{t.label}</p>
                    <div className="mt-0.5 flex items-center justify-between text-[9px] text-muted">
                      <span>{t.direction}</span>
                      {t.score != null && <span>{t.score.toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-8">
        {!payload && (
          <div className="card p-6 text-center">
            <p className="text-[12px] text-text">AttentionBoost data unavailable.</p>
            <p className="text-[10px] text-muted mt-1">Set ATTENTIONBOOST_API_URL and optional ATTENTIONBOOST_API_KEY.</p>
          </div>
        )}

        {payload && segments.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-[12px] text-text">No segments returned.</p>
            <p className="text-[10px] text-muted mt-1">Check upstream response format.</p>
          </div>
        )}

        {segments.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {segments.map((seg) => {
              const power = seg.buyingPower != null ? clamp(seg.buyingPower) : null
              const toneLabel = seg.toneLabel ?? toneFromScore(seg.toneScore)
              return (
                <div key={seg.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[13px] font-extrabold text-text">{seg.label}</h3>
                      {seg.ageRange && (
                        <p className="text-[10px] text-muted mt-1">Age: {seg.ageRange}</p>
                      )}
                    </div>
                    {seg.economyClass && (
                      <span className={`badge ${seg.economyClass === "menengah-atas" ? "badge-amber" : "badge-blue"}`}>
                        {seg.economyClass}
                      </span>
                    )}
                  </div>

                  {(seg.domicile?.primary || seg.domicile?.secondary || seg.domicile?.tertiary) && (
                    <div className="mt-3 text-[10px] text-muted">
                      {seg.domicile?.primary && <p>City 1: {seg.domicile.primary}</p>}
                      {seg.domicile?.secondary && <p>City 2: {seg.domicile.secondary}</p>}
                      {seg.domicile?.tertiary && <p>City 3: {seg.domicile.tertiary}</p>}
                    </div>
                  )}

                  {seg.economyBand && (
                    <p className="mt-2 text-[10px] text-muted">Economy band: {seg.economyBand}</p>
                  )}

                  {seg.topSocial && seg.topSocial.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {seg.topSocial.map((platform) => (
                        <span key={platform} className="badge badge-blue">{platform}</span>
                      ))}
                    </div>
                  )}

                  {(toneLabel || seg.toneScore != null) && (
                    <div className="mt-3 flex items-center justify-between">
                      {toneLabel && (
                        <span className={`badge ${badgeForTone(toneLabel)}`}>Tone: {toneLabel}</span>
                      )}
                      {seg.toneScore != null && (
                        <span className="text-[10px] text-muted">Score: {seg.toneScore.toFixed(2)}</span>
                      )}
                    </div>
                  )}

                  {power != null && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted">
                        <span>Buying power</span>
                        <span>{power.toFixed(1)}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-surface2">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${power}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {seg.trend?.direction && (
                    <div className="mt-3 text-[10px] text-muted">
                      Trend: {trendLabel(seg.trend)}
                      {seg.trend.horizonDays ? ` (${seg.trend.horizonDays}d)` : ""}
                    </div>
                  )}

                  {seg.drivers && seg.drivers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {seg.drivers.slice(0, 4).map((driver) => (
                        <span key={driver} className="badge badge-green">{driver}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
