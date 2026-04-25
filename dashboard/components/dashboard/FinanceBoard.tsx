"use client"
import { useState } from "react"
import type { FinanceData } from "@/lib/types"
import { formatUsd, formatIdr, formatChange, changeClass } from "@/lib/utils"
import GptButton from "@/components/ui/GptButton"

interface Props { data: FinanceData }

const TABS = ["Crypto", "Forex", "Markets"] as const
type Tab = typeof TABS[number]

export default function FinanceBoard({ data }: Props) {
  const [tab, setTab] = useState<Tab>("Crypto")

  return (
    <section className="px-4 py-4">
      <div className="mx-auto max-w-[1400px]">
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-border">
            <div className="flex gap-1">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-[11px] font-extrabold rounded-t transition-colors -mb-px border-b-2 ${
                    tab === t
                      ? "text-primary border-primary"
                      : "text-muted border-transparent hover:text-text"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="text-[9px] text-muted pb-2">Live · revalidate 60s</span>
          </div>

          <div className="p-4">
            {tab === "Crypto" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {data.crypto.map(coin => (
                  <div key={coin.id} className="bg-surface2 rounded-lg p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-muted">{coin.symbol}</span>
                      <GptButton subject={`${coin.name} crypto price analysis`} />
                    </div>
                    <div className="text-sm font-extrabold text-text">{formatUsd(coin.priceUsd)}</div>
                    <div className="text-[10px] text-muted">{formatIdr(coin.priceIdr)}</div>
                    <div className={`text-[11px] font-bold ${changeClass(coin.change24h)}`}>
                      {formatChange(coin.change24h)} 24h
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "Forex" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.forex.map(fx => (
                  <div key={fx.pair} className="bg-surface2 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-extrabold text-muted">{fx.pair}</div>
                      <div className="text-sm font-extrabold text-text mt-0.5">
                        {fx.rate >= 1000
                          ? fx.rate.toLocaleString("id-ID", { maximumFractionDigits: 0 })
                          : fx.rate.toFixed(4)}
                      </div>
                    </div>
                    <GptButton subject={`nilai tukar ${fx.pair} hari ini`} />
                  </div>
                ))}
              </div>
            )}

            {tab === "Markets" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {data.markets.map(m => (
                  <div key={m.ticker} className="bg-surface2 rounded-lg p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-muted uppercase">
                        {m.type === "commodity" ? "⬛" : "📈"} {m.name}
                      </span>
                      <GptButton subject={`${m.name} ${m.type} market outlook`} />
                    </div>
                    <div className="text-sm font-extrabold text-text">
                      {m.price >= 1000
                        ? m.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
                        : m.price.toFixed(2)}
                    </div>
                    <div className={`text-[11px] font-bold ${changeClass(m.change)}`}>
                      {formatChange(m.change)}
                    </div>
                    <div className="text-[9px] text-muted">{m.ticker}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
