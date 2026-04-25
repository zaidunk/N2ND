import StatCard from "@/components/dashboard/StatCard"
import TrendChart from "@/components/dashboard/TrendChart"
import NewsMonitor from "@/components/dashboard/NewsMonitor"
import { BPS_INDICATORS, POVERTY_TREND, UNEMPLOYMENT_TREND, GDP_TREND, INFLATION_TREND } from "@/lib/bps-data"
import type { Article, MarketData } from "@/lib/types"

export const dynamic = "force-dynamic"

const RSS_SOURCES = [
  { id: "antara",     url: "https://www.antaranews.com/rss/terkini.xml",      lang: "id" },
  { id: "detik",      url: "https://rss.detik.com/index.php/detikcom",        lang: "id" },
  { id: "tempo",      url: "https://rss.tempo.co/",                           lang: "id" },
  { id: "aljazeera",  url: "https://www.aljazeera.com/xml/rss/all.xml",       lang: "en" },
  { id: "bbc",        url: "https://feeds.bbci.co.uk/news/rss.xml",           lang: "en" },
]

function parseRSS(xml: string, sourceId: string, lang: string): Article[] {
  const items = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) ?? []
  return items.slice(0, 8).map((item) => {
    const title = (item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) ??
                   item.match(/<title>([^<]+)<\/title>/))?.[1]?.trim() ?? ""
    const link  = (item.match(/<link>([^<]+)<\/link>/) ??
                   item.match(/<link\s[^>]*href="([^"]+)"/))?.[1]?.trim() ?? ""
    const pub   = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.trim()
    const desc  = (item.match(/<description><!\[CDATA\[(.+?)\]\]><\/description>/) ??
                   item.match(/<description>([^<]+)<\/description>/))?.[1]
                   ?.replace(/<[^>]+>/g, "").trim().slice(0, 160)
    return { title, link, summary: desc, published: pub, source: sourceId, source_id: sourceId, lang }
  }).filter(a => a.title && a.link)
}

async function fetchNews(): Promise<Article[]> {
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async ({ id, url, lang }) => {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "n2nd/2.0" },
      })
      if (!r.ok) return []
      return parseRSS(await r.text(), id, lang)
    })
  )
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []).slice(0, 40)
}

async function fetchMarket(): Promise<MarketData> {
  const data: MarketData = { biRate: 5.75 }
  const [forex, btc, ihsg] = await Promise.allSettled([
    fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true", { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
    fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=1d&range=1d", { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
  ])

  if (forex.status === "fulfilled") {
    data.usdIdr = (forex.value as { rates?: Record<string, number> }).rates?.["IDR"]
  }
  if (btc.status === "fulfilled") {
    const b = (btc.value as { bitcoin?: { usd?: number; usd_24h_change?: number } }).bitcoin ?? {}
    data.btcUsd = b.usd; data.btcChange = b.usd_24h_change
  }
  if (ihsg.status === "fulfilled") {
    const meta = (ihsg.value as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; previousClose?: number } }> } }).chart?.result?.[0]?.meta ?? {}
    data.ihsg = meta.regularMarketPrice
    if (meta.regularMarketPrice && meta.previousClose) {
      data.ihsgChange = ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
    }
  }
  return data
}

export default async function HomePage() {
  const [articles, market] = await Promise.all([fetchNews(), fetchMarket()])

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Dashboard Nasional 2026</h1>
          <p className="text-[11px] text-muted mt-0.5">
            Indikator kunci Indonesia 2016–2025 dari Badan Pusat Statistik
          </p>
        </div>
        <span className="text-[9px] text-muted text-right leading-relaxed hidden sm:block">
          BPS · Statistik Indonesia 2026<br />Tabel 8.1
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BPS_INDICATORS.map(ind => (
          <StatCard key={ind.label} {...ind} />
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <TrendChart
          title="Tren Kemiskinan & Pengangguran 2016–2025"
          series={[
            { data: POVERTY_TREND,      color: "#F85149", label: "Kemiskinan (%)" },
            { data: UNEMPLOYMENT_TREND, color: "#F59E0B", label: "Pengangguran (%)" },
          ]}
          height={160}
        />
        <TrendChart
          title="Pertumbuhan GDP & Inflasi 2016–2025"
          series={[
            { data: GDP_TREND,       color: "#10B981", label: "GDP Growth (%)" },
            { data: INFLATION_TREND, color: "#3B82F6", label: "Inflasi (%)" },
          ]}
          height={160}
        />
      </div>

      <NewsMonitor articles={articles} market={market} />
    </div>
  )
}
