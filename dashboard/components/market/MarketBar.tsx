import { getMarket } from "@/lib/api"
import { formatNumber, formatPct } from "@/lib/utils"

export default async function MarketBar() {
  let data: Awaited<ReturnType<typeof getMarket>> | null = null
  try {
    data = await getMarket()
  } catch {
    // silent — bar renders skeleton values
  }

  const m = data?.indicators
  const tension = data?.tension

  const ihsg     = m?.ihsg
  const usdIdr   = m?.usd_idr?.value
  const biRate   = typeof m?.bi_rate === "number" ? m.bi_rate : m?.bi_rate?.value
  const fg       = m?.fear_greed
  const btc      = data?.crypto?.["bitcoin"]
  const tensionScore = tension?.score ?? 0

  const tensionColor =
    tensionScore >= 70 ? "text-negative" :
    tensionScore >= 40 ? "text-accent"   :
    "text-positive"

  const ihsgChg = ihsg?.change_pct
  const ihsgColor = !ihsgChg ? "text-muted" : ihsgChg > 0 ? "text-positive" : "text-negative"

  const items = (
    <>
      {ihsg?.value && (
        <li className="ticker-item">
          <span className="text-muted">IHSG</span>
          <span className="font-extrabold text-text">
            {formatNumber(ihsg.value, { decimals: 0 })}
          </span>
          <span className={`font-bold ${ihsgColor}`}>
            {formatPct(ihsg.change_pct)}
          </span>
        </li>
      )}
      {usdIdr && (
        <li className="ticker-item">
          <span className="text-muted">USD/IDR</span>
          <span className="font-extrabold text-text">
            Rp {formatNumber(usdIdr, { decimals: 0 })}
          </span>
        </li>
      )}
      {biRate != null && (
        <li className="ticker-item">
          <span className="text-muted">BI Rate</span>
          <span className="font-extrabold text-text">{biRate}%</span>
        </li>
      )}
      {btc?.usd && (
        <li className="ticker-item">
          <span className="text-muted">BTC</span>
          <span className="font-extrabold text-text">
            ${formatNumber(btc.usd, { decimals: 0 })}
          </span>
          {btc.change_24h != null && (
            <span className={`font-bold ${btc.change_24h >= 0 ? "text-positive" : "text-negative"}`}>
              {formatPct(btc.change_24h)}
            </span>
          )}
        </li>
      )}
      {fg?.value != null && (
        <li className="ticker-item">
          <span className="text-muted">Fear &amp; Greed</span>
          <span className="font-extrabold text-text">{fg.value}/100</span>
          <span className="font-bold text-muted">{fg.label}</span>
        </li>
      )}
      {tension && (
        <li className="ticker-item">
          <span className="text-muted">Tension</span>
          <span className={`font-extrabold ${tensionColor}`}>
            {tensionScore}/100 — {tension.label}
          </span>
        </li>
      )}
    </>
  )

  return (
    <div className="border-b border-border bg-surface">
      <div className="ticker-wrap">
        {/* Duplicate items for seamless loop */}
        <ul className="ticker-list">
          {items}
          {items}
        </ul>
      </div>
    </div>
  )
}
