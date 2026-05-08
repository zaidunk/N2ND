import Hero from "@/components/dashboard/Hero"
import TickerBar from "@/components/dashboard/TickerBar"
import PromoPopup from "@/components/dashboard/PromoPopup"
import FinanceBoard from "@/components/dashboard/FinanceBoard"
import NewsSection from "@/components/dashboard/NewsSection"
import TrendsSection from "@/components/dashboard/TrendsSection"
import ProgramStudi from "@/components/dashboard/ProgramStudi"
import BPSViz from "@/components/dashboard/BPSViz"
import WorldBankSection from "@/components/dashboard/WorldBankSection"
import ToSFooter from "@/components/dashboard/ToSFooter"
import type { FinanceData, Article, TrendsData, WorldBankSeries, WorldBankPoint } from "@/lib/types"

export const revalidate = 3600

// -- helpers ---------------------------------------------------------------

const T = (ms: number) => AbortSignal.timeout(ms)

async function safeJson(url: string, ms = 5000): Promise<unknown> {
  const r = await fetch(url, { signal: T(ms), headers: { "User-Agent": "n2nd/2.0" } })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

async function safeText(url: string, ms = 6000): Promise<string> {
  const r = await fetch(url, {
    signal: T(ms),
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" },
  })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.text()
}

async function stooqMeta(symbol: string): Promise<{ price: number; prev: number; history: number[] } | null> {
  try {
    const text = await safeText(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=35d`,
      8000
    )
    type YC = {
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number }
          indicators?: { quote?: Array<{ close?: (number | null)[] }> }
        }>
      }
    }
    const d = JSON.parse(text) as YC
    const result = d.chart?.result?.[0]
    if (!result?.meta?.regularMarketPrice) return null
    const price  = result.meta.regularMarketPrice
    const closes = result.indicators?.quote?.[0]?.close?.filter((v): v is number => v != null) ?? []
    if (!closes.length) return null
    const prev    = closes.length >= 2 ? closes[closes.length - 2] : price
    const history = closes.slice(-30)
    return { price, prev, history }
  } catch { return null }
}

// -- data fetchers ----------------------------------------------------------

const COIN_DEFS = [
  { id: "btc-bitcoin",      symbol: "BTC",  name: "Bitcoin"   },
  { id: "eth-ethereum",     symbol: "ETH",  name: "Ethereum"  },
  { id: "bnb-binance-coin", symbol: "BNB",  name: "BNB"       },
  { id: "sol-solana",       symbol: "SOL",  name: "Solana"    },
  { id: "xrp-ripple",       symbol: "XRP",  name: "XRP"       },
  { id: "doge-dogecoin",    symbol: "DOGE", name: "Dogecoin"  },
  { id: "ada-cardano",      symbol: "ADA",  name: "Cardano"   },
  { id: "avax-avalanche",   symbol: "AVAX", name: "Avalanche" },
  { id: "trx-tron",         symbol: "TRX",  name: "TRON"      },
  { id: "link-chainlink",   symbol: "LINK", name: "Chainlink" },
]

async function fetchFinance(): Promise<FinanceData> {
  const data: FinanceData = { biRate: 5.75, crypto: [], forex: [], markets: [], fetchedAt: new Date().toISOString() }

  const startDate = new Date(Date.now() - 31 * 86400000).toISOString().slice(0, 10)
  const endDate   = new Date().toISOString().slice(0, 10)

  // Sources: CoinPaprika (free, no key) · Frankfurter/ECB · Stooq · Alternative.me
  const [mainR, coinsR] = await Promise.all([
    Promise.allSettled([
      safeJson("https://api.frankfurter.app/latest?from=USD&to=IDR,EUR,CNY", 5000),
      stooqMeta("^jkse"),
      stooqMeta("^spx"),
      stooqMeta("^ndq"),
      stooqMeta("^nkx"),
      stooqMeta("gc.f"),
      stooqMeta("cl.f"),
      safeJson("https://api.alternative.me/fng/?limit=1"),
      safeJson(`https://api.frankfurter.app/${startDate}..${endDate}?from=USD&to=IDR,EUR,CNY`, 8000),
    ]),
    Promise.allSettled([
      ...COIN_DEFS.map(c => safeJson(`https://api.coinpaprika.com/v1/tickers/${c.id}?quotes=USD`, 6000)),
      ...COIN_DEFS.map(c => safeJson(`https://api.coinpaprika.com/v1/tickers/${c.id}/historical?start=${startDate}&interval=1d&quote=USD&limit=31`, 8000)),
    ]),
  ])

  const [fxRes, ihsgRes, spRes, ndqRes, nkxRes, gcRes, clRes, fgRes, fxHistRes] = mainR
  const coinTickerR = coinsR.slice(0, COIN_DEFS.length)
  const coinHistR   = coinsR.slice(COIN_DEFS.length)

  let usdIdr = 16000
  if (fxRes.status === "fulfilled") {
    const rates = (fxRes.value as { rates?: Record<string, number> }).rates ?? {}
    usdIdr = rates["IDR"] ?? usdIdr
    const eur = rates["EUR"]; const cny = rates["CNY"]
    data.usdIdr = usdIdr
    data.forex = [
      { pair: "USD/IDR", from: "USD", to: "IDR", rate: usdIdr },
      { pair: "EUR/IDR", from: "EUR", to: "IDR", rate: eur && usdIdr ? usdIdr / eur : 0 },
      { pair: "CNY/IDR", from: "CNY", to: "IDR", rate: cny && usdIdr ? usdIdr / cny : 0 },
      { pair: "USD/EUR", from: "USD", to: "EUR", rate: eur ?? 0 },
      { pair: "USD/CNY", from: "USD", to: "CNY", rate: cny ?? 0 },
    ].filter(p => p.rate > 0)
  }

  if (fxHistRes.status === "fulfilled") {
    type FxRates = Record<string, number>
    const fxHistRaw = fxHistRes.value as { rates?: Record<string, FxRates> }
    const dkeys     = Object.keys(fxHistRaw.rates ?? {}).sort()
    const idrS      = dkeys.map(d => fxHistRaw.rates![d].IDR ?? NaN)
    const eurS      = dkeys.map(d => fxHistRaw.rates![d].EUR ?? NaN)
    const cnyS      = dkeys.map(d => fxHistRaw.rates![d].CNY ?? NaN)
    const fxHistMap: Record<string, number[]> = {
      "USD/IDR": idrS.filter(isFinite).slice(-30),
      "USD/EUR": eurS.filter(isFinite).slice(-30),
      "USD/CNY": cnyS.filter(isFinite).slice(-30),
      "EUR/IDR": idrS.map((v, i) => eurS[i] ? v / eurS[i] : NaN).filter(isFinite).slice(-30),
      "CNY/IDR": idrS.map((v, i) => cnyS[i] ? v / cnyS[i] : NaN).filter(isFinite).slice(-30),
    }
    data.forex = data.forex.map(fx => ({ ...fx, history: fxHistMap[fx.pair] ?? [] }))
  }

  // Build crypto from CoinPaprika tickers
  type PapTicker = { quotes?: { USD?: { price?: number; percent_change_24h?: number } } }
  COIN_DEFS.forEach((def, i) => {
    const res = coinTickerR[i]
    if (res.status !== "fulfilled") return
    const c = res.value as PapTicker
    const priceUsd  = c.quotes?.USD?.price ?? 0
    const change24h = c.quotes?.USD?.percent_change_24h ?? 0
    data.crypto.push({ id: def.id, symbol: def.symbol, name: def.name, priceUsd, priceIdr: priceUsd * usdIdr, change24h })
    if (def.id === "btc-bitcoin")  { data.btcUsd = priceUsd; data.btcChange = change24h }
    if (def.id === "eth-ethereum")   data.ethUsd = priceUsd
  })

  // Attach coin 30D history
  type PapHist = { price?: number }
  const coinHistMap: Record<string, number[]> = {}
  COIN_DEFS.forEach((def, i) => {
    const res = coinHistR[i]
    if (res.status !== "fulfilled") return
    const pts = (res.value as PapHist[]).map(p => p.price ?? NaN).filter(isFinite)
    coinHistMap[def.id] = pts.slice(-30)
  })
  data.crypto = data.crypto.map(coin => ({ ...coin, history: coinHistMap[coin.id] ?? [] }))

  const mkStock = (name: string, ticker: string, type: "index" | "commodity", res: PromiseSettledResult<{ price: number; prev: number; history: number[] } | null>) => {
    if (res.status !== "fulfilled" || !res.value) return null
    const v = res.value
    return { name, ticker, type, price: v.price, change: v.prev ? ((v.price - v.prev) / v.prev) * 100 : 0, history: v.history }
  }
  const stocks = [
    mkStock("IHSG",       "^jkse", "index",     ihsgRes),
    mkStock("S&P 500",    "^spx",  "index",     spRes),
    mkStock("Nasdaq",     "^ndq",  "index",     ndqRes),
    mkStock("Nikkei 225", "^nkx",  "index",     nkxRes),
    mkStock("Gold",       "gc.f",  "commodity", gcRes),
    mkStock("Oil (WTI)",  "cl.f",  "commodity", clRes),
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
  const items = xml.match(new RegExp(`<${tag}[^>]*>[\s\S]*?<\/${tag}>`, "g")) ?? []
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
  // Indonesian
  { id: "antara",    url: "https://www.antaranews.com/rss/terkini.xml",                   lang: "id", atom: false },
  { id: "tempo",     url: "https://rss.tempo.co/",                                        lang: "id", atom: false },
  { id: "detik",     url: "https://rss.detik.com/index.php/detikcom_mostpopular",         lang: "id", atom: false },
  { id: "cnn_id",    url: "https://www.cnnindonesia.com/rss/",                            lang: "id", atom: false },
  { id: "cnbc_id",   url: "https://www.cnbcindonesia.com/rss",                            lang: "id", atom: false },
  { id: "tribun",    url: "https://www.tribunnews.com/rss",                                lang: "id", atom: false },
  { id: "kumparan",  url: "https://kumparan.com/feed",                                     lang: "id", atom: true  },
  { id: "kompas",    url: "https://rss.kompas.com/index.php/kompas/terkini",               lang: "id", atom: false },
  { id: "liputan6",  url: "https://www.liputan6.com/news/feed.rss",                       lang: "id", atom: false },
  { id: "republika", url: "https://www.republika.co.id/rss",                              lang: "id", atom: false },
  { id: "kontan",    url: "https://www.kontan.co.id/rss",                                 lang: "id", atom: false },
  { id: "bisnis",    url: "https://www.bisnis.com/rss",                                   lang: "id", atom: false },
  { id: "sindonews", url: "https://sindikasi.sindonews.com/rss/nasional",                 lang: "id", atom: false },
  { id: "jakpost",   url: "https://www.thejakartapost.com/feed",                          lang: "en", atom: true  },
  { id: "dw_id",     url: "https://rss.dw.com/rdf/rss-id-ind",                           lang: "id", atom: false },
  // International
  { id: "bbc",       url: "https://feeds.bbci.co.uk/news/rss.xml",                       lang: "en", atom: false },
  { id: "aljazeera", url: "https://www.aljazeera.com/xml/rss/all.xml",                   lang: "en", atom: false },
  { id: "guardian",  url: "https://www.theguardian.com/world/rss",                       lang: "en", atom: false },
  { id: "dw_en",     url: "https://rss.dw.com/rdf/rss-en-world",                         lang: "en", atom: false },
  { id: "france24",  url: "https://www.france24.com/en/rss",                             lang: "en", atom: false },
  { id: "cna",       url: "https://www.channelnewsasia.com/rssfeeds/8395984",             lang: "en", atom: false },
  { id: "scmp",      url: "https://www.scmp.com/rss/91/feed",                            lang: "en", atom: false },
  { id: "euronews",  url: "https://feeds.feedburner.com/euronews/en/news",               lang: "en", atom: false },
  { id: "rfi_id",    url: "https://www.rfi.fr/id/rss",                                   lang: "id", atom: false },
  { id: "voa_en",    url: "https://feeds.voanews.com/voaspecialenglish",                  lang: "en", atom: false },
]

async function fetchAllNews(): Promise<Article[]> {
  const results = await Promise.allSettled(
    NEWS_SOURCES.map(async ({ id, url, lang, atom }) => {
      const r = await fetch(url, {
        signal: T(6000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
      })
      if (!r.ok) return []
      return extractRSS(await r.text(), id, lang, atom)
    })
  )
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []).filter(a => a.title)
}

function fetchTrends(): TrendsData {
  return { trending: [], fetchedAt: new Date().toISOString() }
}


const IMF_INDICATORS: Array<{ id: string; label: string; unit: string; code: string }> = [
  { id: "imf-gdp-growth",   label: "PDB Growth (IMF Proj.)",       unit: "%",           code: "NGDP_RPCH" },
  { id: "imf-inflation",    label: "Inflasi (IMF Proj.)",           unit: "%",           code: "PCPIPCH" },
  { id: "imf-gdp-percap",   label: "PDB per Kapita (IMF Proj.)",   unit: "USD per kapita", code: "NGDPDPC" },
  { id: "imf-gov-debt",     label: "Utang Pemerintah (IMF Proj.)", unit: "% PDB",       code: "GGXWDG_NGDP" },
  { id: "imf-current-acct", label: "Current Account (IMF Proj.)",  unit: "% PDB",       code: "BCA_NGDPD" },
]

async function fetchIMF(): Promise<WorldBankSeries[]> {
  const results = await Promise.allSettled(
    IMF_INDICATORS.map(async ({ id, label, unit, code }) => {
      const raw = await safeJson(
        `https://www.imf.org/external/datamapper/api/v1/${code}/IDN`, 8000
      ) as { values?: Record<string, { IDN?: Record<string, number> }> }
      const yearMap = raw.values?.[code]?.IDN ?? {}
      const points: WorldBankPoint[] = Object.entries(yearMap)
        .filter(([, v]) => v != null && isFinite(v as number))
        .map(([yr, v]) => ({ year: parseInt(yr), value: v as number, isProjection: parseInt(yr) >= 2025 }))
        .sort((a, b) => a.year - b.year)
      if (!points.length) return null
      const actuals = points.filter(p => !p.isProjection)
      const latest = actuals[actuals.length - 1]?.value
      const prev   = actuals[actuals.length - 2]?.value
      const change = prev != null && latest != null ? latest - prev : undefined
      return { id, label, unit, source: "IMF", points, latest, change } as WorldBankSeries
    })
  )
  return results
    .filter(r => r.status === "fulfilled" && r.value != null)
    .map(r => (r as PromiseFulfilledResult<WorldBankSeries>).value!)
}

const WB_INDICATORS: Array<{ id: string; label: string; unit: string; code: string }> = [
  { id: "gdp-growth",    label: "Pertumbuhan PDB",         unit: "%",           code: "NY.GDP.MKTP.KD.ZG" },
  { id: "inflation",     label: "Inflasi Konsumen",        unit: "%",           code: "FP.CPI.TOTL.ZG" },
  { id: "unemployment",  label: "Pengangguran",            unit: "%",           code: "SL.UEM.TOTL.ZS" },
  { id: "gdp-percapita", label: "PDB per Kapita",          unit: "USD per kapita", code: "NY.GDP.PCAP.CD" },
  { id: "internet",      label: "Pengguna Internet",       unit: "%",           code: "IT.NET.USER.ZS" },
  { id: "education-exp", label: "Belanja Pendidikan",      unit: "% PDB",       code: "SE.XPD.TOTL.GD.ZS" },
  { id: "health-exp",    label: "Belanja Kesehatan",       unit: "% PDB",       code: "SH.XPD.CHEX.GD.ZS" },
  { id: "gini",          label: "Koefisien Gini",          unit: "poin",        code: "SI.POV.GINI" },
  { id: "co2",           label: "Emisi CO2",               unit: "Mt CO2",      code: "EN.ATM.CO2E.KT" },
  { id: "life-exp",      label: "Harapan Hidup",           unit: "tahun",       code: "SP.DYN.LE00.IN" },
  { id: "poverty",       label: "Kemiskinan ($2.15/hari)", unit: "%",           code: "SI.POV.DDAY" },
  { id: "fdi-gdp",       label: "FDI Net Inflows",         unit: "% PDB",       code: "BX.KLT.DINV.WD.GD.ZS" },
]

async function fetchWorldBank(): Promise<WorldBankSeries[]> {
  type WBRow = { value: number | null; date: string }
  const results = await Promise.allSettled(
    WB_INDICATORS.map(async ({ id, label, unit, code }) => {
      const raw = await safeJson(
        `https://api.worldbank.org/v2/country/IDN/indicator/${code}?format=json&mrv=30&per_page=30`,
        8000
      ) as [unknown, WBRow[] | null]
      const rows = raw[1] ?? []
      const points = rows
        .filter(d => d.value !== null)
        .map(d => ({
          year: parseInt(d.date),
          value: code === "EN.ATM.CO2E.KT" ? d.value! / 1000 : d.value!,
        }))
        .sort((a, b) => a.year - b.year)
      if (!points.length) return null
      const latest = points[points.length - 1].value
      const prev   = points[points.length - 2]?.value
      const change = prev != null ? latest - prev : undefined
      return { id, label, unit, source: "World Bank", points, latest, change } as WorldBankSeries
    })
  )
  return results
    .filter(r => r.status === "fulfilled" && r.value != null)
    .map(r => (r as PromiseFulfilledResult<WorldBankSeries>).value!)
}

// -- page -------------------------------------------------------------------

export default async function HomePage() {
  const [financeRes, newsRes, wbRes, imfRes] = await Promise.allSettled([
    fetchFinance(),
    fetchAllNews(),
    fetchWorldBank(),
    fetchIMF(),
  ])

  const finance = financeRes.status === "fulfilled"
    ? financeRes.value
    : { biRate: 5.75, crypto: [], forex: [], markets: [], fetchedAt: new Date().toISOString() } as FinanceData

  const articles = newsRes.status === "fulfilled" ? newsRes.value : []
  const trends   = fetchTrends()
  const wbSeries = [
    ...(wbRes.status === "fulfilled" ? wbRes.value : []),
    ...(imfRes.status === "fulfilled" ? imfRes.value : []),
  ]
  return (
    <div className="min-h-screen">
      <PromoPopup />
      <Hero />
      <TickerBar data={finance} />
      <FinanceBoard data={finance} />
      <NewsSection articles={articles} />
      <TrendsSection data={trends} />
      <ProgramStudi />
      <BPSViz />
      <WorldBankSection series={wbSeries} />
      <ToSFooter />
    </div>
  )
}
