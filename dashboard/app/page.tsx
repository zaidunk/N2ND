import Hero from "@/components/dashboard/Hero"
import TickerBar from "@/components/dashboard/TickerBar"
import FinanceBoard from "@/components/dashboard/FinanceBoard"
import NewsSection from "@/components/dashboard/NewsSection"
import TrendsSection from "@/components/dashboard/TrendsSection"
import ProgramStudi from "@/components/dashboard/ProgramStudi"
import BPSViz from "@/components/dashboard/BPSViz"
import type { FinanceData, Article, TrendsData, CoinData, TrendItem } from "@/lib/types"

export const revalidate = 60

// ── helpers ────────────────────────────────────────────────────────────────

const T = (ms: number) => AbortSignal.timeout(ms)

async function safeJson(url: string, ms = 5000): Promise<unknown> {
  const r = await fetch(url, { signal: T(ms), headers: { "User-Agent": "n2nd/2.0" } })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

async function yahooMeta(ticker: string): Promise<{ price: number; prev: number } | null> {
  try {
    const d = await safeJson(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
    ) as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; previousClose?: number } }> } }
    const m = d.chart?.result?.[0]?.meta ?? {}
    if (!m.regularMarketPrice) return null
    return { price: m.regularMarketPrice, prev: m.previousClose ?? m.regularMarketPrice }
  } catch { return null }
}

// ── data fetchers ──────────────────────────────────────────────────────────

async function fetchFinance(): Promise<FinanceData> {
  const data: FinanceData = { biRate: 5.75, crypto: [], forex: [], markets: [], fetchedAt: new Date().toISOString() }

  const [coinRes, fxRes, ihsgRes, spRes, ixRes, n225Res, gcRes, clRes, fgRes] = await Promise.allSettled([
    safeJson("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple,dogecoin&vs_currencies=usd,idr&include_24hr_change=true"),
    safeJson("https://open.er-api.com/v6/latest/USD"),
    yahooMeta("^JKSE"),
    yahooMeta("^GSPC"),
    yahooMeta("^IXIC"),
    yahooMeta("^N225"),
    yahooMeta("GC=F"),
    yahooMeta("CL=F"),
    safeJson("https://api.alternative.me/fng/?limit=1"),
  ])

  if (coinRes.status === "fulfilled") {
    const raw = coinRes.value as Record<string, { usd?: number; idr?: number; usd_24h_change?: number }>
    const MAP: [string, string, string][] = [
      ["bitcoin", "BTC", "Bitcoin"], ["ethereum", "ETH", "Ethereum"],
      ["binancecoin", "BNB", "BNB"], ["solana", "SOL", "Solana"],
      ["ripple", "XRP", "XRP"], ["dogecoin", "DOGE", "Dogecoin"],
    ]
    data.crypto = MAP.map(([id, sym, name]): CoinData => ({
      id, symbol: sym, name,
      priceUsd: raw[id]?.usd ?? 0, priceIdr: raw[id]?.idr ?? 0,
      change24h: raw[id]?.usd_24h_change ?? 0,
    }))
    data.btcUsd = raw.bitcoin?.usd; data.btcChange = raw.bitcoin?.usd_24h_change
    data.ethUsd = raw.ethereum?.usd
  }

  if (fxRes.status === "fulfilled") {
    const rates = (fxRes.value as { rates?: Record<string, number> }).rates ?? {}
    const idr = rates["IDR"]; const eur = rates["EUR"]; const cny = rates["CNY"]
    data.usdIdr = idr
    data.forex = [
      { pair: "USD/IDR", from: "USD", to: "IDR", rate: idr ?? 0 },
      { pair: "EUR/IDR", from: "EUR", to: "IDR", rate: eur ? idr / eur : 0 },
      { pair: "CNY/IDR", from: "CNY", to: "IDR", rate: cny ? idr / cny : 0 },
      { pair: "USD/EUR", from: "USD", to: "EUR", rate: eur ?? 0 },
      { pair: "USD/CNY", from: "USD", to: "CNY", rate: cny ?? 0 },
    ].filter(p => p.rate > 0)
  }

  const mkStock = (name: string, ticker: string, type: "index" | "commodity", res: { price: number; prev: number } | null) => {
    if (!res) return null
    return { name, ticker, type, price: res.price, change: ((res.price - res.prev) / res.prev) * 100 }
  }
  const stocks = [
    mkStock("IHSG",      "^JKSE", "index",     ihsgRes.status === "fulfilled" ? ihsgRes.value : null),
    mkStock("S&P 500",   "^GSPC", "index",     spRes.status   === "fulfilled" ? spRes.value   : null),
    mkStock("Nasdaq",    "^IXIC", "index",     ixRes.status   === "fulfilled" ? ixRes.value   : null),
    mkStock("Nikkei 225","^N225", "index",     n225Res.status === "fulfilled" ? n225Res.value : null),
    mkStock("Gold",      "GC=F",  "commodity", gcRes.status   === "fulfilled" ? gcRes.value   : null),
    mkStock("Oil (WTI)", "CL=F",  "commodity", clRes.status   === "fulfilled" ? clRes.value   : null),
  ]
  data.markets = stocks.filter(Boolean) as FinanceData["markets"]

  const ihsg = stocks[0]; const sp500 = stocks[1]; const gold = stocks[4]
  if (ihsg) { data.ihsg = ihsg.price; data.ihsgChange = ihsg.change }
  if (sp500) { data.sp500 = sp500.price; data.sp500Change = sp500.change }
  if (gold)  { data.goldUsd = gold.price; data.goldChange = gold.change }

  if (fgRes.status === "fulfilled") {
    const fg = (fgRes.value as { data?: Array<{ value?: string; value_classification?: string }> }).data?.[0] ?? {}
    data.fearGreed = fg.value ? parseInt(fg.value) : undefined
    data.fearGreedLabel = fg.value_classification
  }

  return data
}

function extractRSS(xml: string, sourceId: string, lang: string, atom = false): Article[] {
  const tag = atom ? "entry" : "item"
  const items = xml.match(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "g")) ?? []
  return items.slice(0, 6).map((item): Article => {
    const title = (item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) ??
                   item.match(/<title>([^<]+)<\/title>/))?.[1]?.trim() ?? ""
    const link  = (item.match(/<link>([^<]+)<\/link>/) ??
                   item.match(/<link[^>]+href="([^"]+)"/) ??
                   item.match(/<link[^>]*\/?>([^<]*)</))?.[1]?.trim() ?? ""
    const pub   = (item.match(/<pubDate>([^<]+)<\/pubDate>/) ??
                   item.match(/<published>([^<]+)<\/published>/))?.[1]?.trim()
    const desc  = (item.match(/<description><!\[CDATA\[(.+?)\]\]><\/description>/) ??
                   item.match(/<description>([^<]+)<\/description>/) ??
                   item.match(/<summary[^>]*>(.+?)<\/summary>/))?.[1]
                   ?.replace(/<[^>]+>/g, "").trim().slice(0, 160)
    return { title, link, summary: desc, published: pub, source: sourceId, source_id: sourceId, lang }
  }).filter(a => a.title && a.link)
}

const NEWS_SOURCES = [
  { id: "antara",    url: "https://www.antaranews.com/rss/terkini.xml",           lang: "id", atom: false },
  { id: "tempo",     url: "https://rss.tempo.co/",                                lang: "id", atom: false },
  { id: "detik",     url: "https://rss.detik.com/index.php/detikcom_mostpopular", lang: "id", atom: false },
  { id: "cnn_id",    url: "https://www.cnnindonesia.com/rss/",                    lang: "id", atom: false },
  { id: "cnbc_id",   url: "https://www.cnbcindonesia.com/rss",                    lang: "id", atom: false },
  { id: "tribun",    url: "https://www.tribunnews.com/rss",                        lang: "id", atom: false },
  { id: "kumparan",  url: "https://kumparan.com/feed",                             lang: "id", atom: true  },
  { id: "bbc",       url: "https://feeds.bbci.co.uk/news/rss.xml",                lang: "en", atom: false },
  { id: "aljazeera", url: "https://www.aljazeera.com/xml/rss/all.xml",            lang: "en", atom: false },
]

async function fetchAllNews(): Promise<Article[]> {
  const results = await Promise.allSettled(
    NEWS_SOURCES.map(async ({ id, url, lang, atom }) => {
      const r = await fetch(url, { signal: T(6000), headers: { "User-Agent": "n2nd/2.0" } })
      if (!r.ok) return []
      return extractRSS(await r.text(), id, lang, atom)
    })
  )
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []).filter(a => a.title)
}

async function fetchTrends(): Promise<TrendsData> {
  const data: TrendsData = { trending: [], fetchedAt: new Date().toISOString() }
  try {
    const r = await fetch(
      "https://trends.google.com/trends/trendingsearches/daily/rss?geo=ID",
      { signal: T(8000), headers: { "User-Agent": "n2nd/2.0", Accept: "application/rss+xml,text/xml" } }
    )
    if (r.ok) {
      const xml = await r.text()
      const items = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) ?? []
      data.trending = items.slice(0, 20).map((item): TrendItem => {
        const title   = (item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) ??
                         item.match(/<title>([^<]+)<\/title>/))?.[1]?.trim() ?? ""
        const traffic = item.match(/<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/)?.[1]?.trim()
        return { title, traffic }
      }).filter(t => t.title)
    }
  } catch { /* empty trending is fine */ }
  return data
}

// ── page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [financeRes, newsRes, trendsRes] = await Promise.allSettled([
    fetchFinance(),
    fetchAllNews(),
    fetchTrends(),
  ])

  const finance = financeRes.status === "fulfilled"
    ? financeRes.value
    : { biRate: 5.75, crypto: [], forex: [], markets: [], fetchedAt: new Date().toISOString() } as FinanceData

  const articles = newsRes.status === "fulfilled" ? newsRes.value : []
  const trends   = trendsRes.status === "fulfilled" ? trendsRes.value : { trending: [], fetchedAt: new Date().toISOString() }

  return (
    <div className="min-h-screen">
      <Hero />
      <TickerBar data={finance} />
      <FinanceBoard data={finance} />
      <NewsSection articles={articles} />
      <TrendsSection data={trends} />
      <ProgramStudi />
      <BPSViz />
    </div>
  )
}
