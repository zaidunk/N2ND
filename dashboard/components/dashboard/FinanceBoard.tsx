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
    <section className="px-2 sm:px-4 py-2">
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

          <div className="p-2 sm:p-4">
            {tab === "Crypto" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                {data.crypto.map(coin => (
                  <div key={coin.id} className="bg-surface2 rounded-lg p-2 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-muted">{coin.symbol}</span>
                      <GptButton subject={`${coin.name} (${coin.symbol}) crypto aset digital. Analisis: (1) kondisi harga terkini dan sentimen pasar saat ini, (2) faktor teknikal dan fundamental penggerak harga 30 hari ke depan, (3) level support dan resistance kunci, (4) risk assessment untuk investor ritel Indonesia, (5) perbandingan dengan Bitcoin dan altcoin sejenis, (6) regulasi crypto OJK dan Bappebti Indonesia terbaru, (7) rekomendasi: beli, hold, atau jual untuk horizon 3 bulan`} />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
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
                    <GptButton subject={`kurs ${fx.pair} hari ini. Analisis: (1) level terkini dan tren jangka pendek, (2) faktor fundamental penggerak — BI rate, inflasi, neraca dagang, (3) dampak terhadap impor, ekspor, dan utang luar negeri Indonesia, (4) prediksi 1-3 bulan ke depan menurut konsensus analis, (5) strategi hedging untuk pelaku bisnis dan investor Indonesia`} />
                  </div>
                ))}
              </div>
            )}

            {tab === "Markets" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                {data.markets.map(m => (
                  <div key={m.ticker} className="bg-surface2 rounded-lg p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-muted uppercase">
                        {m.type === "commodity" ? "⬛" : "📈"} {m.name}
                      </span>
                      <GptButton subject={`${m.name} ${m.type === 'index' ? 'indeks saham' : 'komoditas'} global terkini. Analisis: (1) pergerakan terkini dan katalis utama, (2) sentimen investor global dan regional, (3) dampak terhadap IHSG dan portofolio investor Indonesia, (4) sektor saham dan emiten yang paling terpengaruh, (5) outlook 1-3 bulan ke depan berdasarkan data makroekonomi, (6) strategi posisi yang disarankan untuk investor Indonesia`} />
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
