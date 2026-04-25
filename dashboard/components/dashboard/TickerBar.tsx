import type { FinanceData } from "@/lib/types"
import { formatUsd, formatChange, changeClass } from "@/lib/utils"

interface Props { data: FinanceData }

interface TickerItem { label: string; value: string; change?: number; sub?: string }

function buildItems(data: FinanceData): TickerItem[] {
  const items: TickerItem[] = []
  if (data.btcUsd)   items.push({ label: "BTC",      value: formatUsd(data.btcUsd),   change: data.btcChange })
  if (data.ethUsd)   items.push({ label: "ETH",       value: formatUsd(data.ethUsd) })
  if (data.ihsg)     items.push({ label: "IHSG",      value: data.ihsg.toLocaleString("id-ID", { maximumFractionDigits: 0 }), change: data.ihsgChange })
  if (data.usdIdr)   items.push({ label: "USD/IDR",   value: `Rp ${data.usdIdr.toLocaleString("id-ID", { maximumFractionDigits: 0 })}` })
  if (data.sp500)    items.push({ label: "S&P 500",   value: data.sp500.toLocaleString("en-US", { maximumFractionDigits: 0 }), change: data.sp500Change })
  if (data.goldUsd)  items.push({ label: "Gold",      value: formatUsd(data.goldUsd),  change: data.goldChange })
  if (data.fearGreed != null) items.push({ label: "Fear&Greed", value: String(data.fearGreed), sub: data.fearGreedLabel })
  items.push({ label: "BI Rate", value: `${data.biRate}%` })
  return items
}

export default function TickerBar({ data }: Props) {
  const items = buildItems(data)
  const doubled = [...items, ...items]

  return (
    <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap py-0.5">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-5 py-1 text-[11px] border-r border-border/40 shrink-0">
            <span className="text-muted font-bold tracking-wide">{item.label}</span>
            <span className="text-text font-extrabold">{item.value}</span>
            {item.change != null && (
              <span className={`${changeClass(item.change)} text-[10px] font-bold`}>
                {formatChange(item.change)}
              </span>
            )}
            {item.sub && (
              <span className="text-[10px] text-muted">{item.sub}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
