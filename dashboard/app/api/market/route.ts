import { NextResponse } from "next/server"
import type { FinanceData, CoinData, ForexPair, StockData } from "@/lib/types"

export const revalidate = 60

const T = (ms: number) => AbortSignal.timeout(ms)

async function safeJson(url: string, ms = 5000): Promise<unknown> {
  const r = await fetch(url, { signal: T(ms), headers: { "User-Agent": "n2nd/2.0" } })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

async function yahooMeta(ticker: string): Promise<{ price: number; prev: number } | null> {
  try {
    const d = await safeJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`) as {
      chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; previousClose?: number } }> }
    }
    const m = d.chart?.result?.[0]?.meta ?? {}
    if (!m.regularMarketPrice) return null
    return { price: m.regularMarketPrice, prev: m.previousClose ?? m.regularMarketPrice }
  } catch { return null }
}

export async function GET() {
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

  // Crypto
  if (coinRes.status === "fulfilled") {
    const raw = coinRes.value as Record<string, { usd?: number; idr?: number; usd_24h_change?: number }>
    const MAP: [string, string, string][] = [
      ["bitcoin", "BTC", "Bitcoin"],
      ["ethereum", "ETH", "Ethereum"],
      ["binancecoin", "BNB", "BNB"],
      ["solana", "SOL", "Solana"],
      ["ripple", "XRP", "XRP"],
      ["dogecoin", "DOGE", "Dogecoin"],
    ]
    data.crypto = MAP.map(([id, sym, name]): CoinData => ({
      id, symbol: sym, name,
      priceUsd: raw[id]?.usd ?? 0,
      priceIdr: raw[id]?.idr ?? 0,
      change24h: raw[id]?.usd_24h_change ?? 0,
    }))
    data.btcUsd = raw.bitcoin?.usd
    data.btcChange = raw.bitcoin?.usd_24h_change
    data.ethUsd = raw.ethereum?.usd
  }

  // Forex
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

  // Stocks & commodities
  const mkStock = (name: string, ticker: string, type: "index" | "commodity", res: { price: number; prev: number } | null): StockData | null => {
    if (!res) return null
    return { name, ticker, type, price: res.price, change: ((res.price - res.prev) / res.prev) * 100 }
  }
  const stocks: (StockData | null)[] = [
    mkStock("IHSG", "^JKSE", "index", ihsgRes.status === "fulfilled" ? ihsgRes.value : null),
    mkStock("S&P 500", "^GSPC", "index", spRes.status === "fulfilled" ? spRes.value : null),
    mkStock("Nasdaq", "^IXIC", "index", ixRes.status === "fulfilled" ? ixRes.value : null),
    mkStock("Nikkei 225", "^N225", "index", n225Res.status === "fulfilled" ? n225Res.value : null),
    mkStock("Gold", "GC=F", "commodity", gcRes.status === "fulfilled" ? gcRes.value : null),
    mkStock("Oil (WTI)", "CL=F", "commodity", clRes.status === "fulfilled" ? clRes.value : null),
  ]
  data.markets = stocks.filter(Boolean) as StockData[]

  const ihsg = stocks[0]; const sp500 = stocks[1]; const gold = stocks[4]
  if (ihsg) { data.ihsg = ihsg.price; data.ihsgChange = ihsg.change }
  if (sp500) { data.sp500 = sp500.price; data.sp500Change = sp500.change }
  if (gold) { data.goldUsd = gold.price; data.goldChange = gold.change }

  // Fear & Greed
  if (fgRes.status === "fulfilled") {
    const fg = (fgRes.value as { data?: Array<{ value?: string; value_classification?: string }> }).data?.[0] ?? {}
    data.fearGreed = fg.value ? parseInt(fg.value) : undefined
    data.fearGreedLabel = fg.value_classification
  }

  return NextResponse.json(data)
}
