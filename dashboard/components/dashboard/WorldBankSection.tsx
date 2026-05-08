"use client"
import { useRef } from "react"
import type { WorldBankSeries } from "@/lib/types"
import GptButton from "@/components/ui/GptButton"
import TrendChart from "@/components/dashboard/TrendChart"

interface Props { series: WorldBankSeries[] }

function changeClass(v?: number) {
  if (v == null) return "text-muted"
  return v >= 0 ? "text-emerald-400" : "text-red-400"
}

function fmtChange(v?: number) {
  if (v == null) return ""
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%"
}

function fmtValue(v: number, unit: string) {
  if (unit === "%" || unit === "USD" || unit === "index") return v.toFixed(2) + " " + unit
  if (unit === "USD per kapita") return "$" + Math.round(v).toLocaleString("en-US")
  if (unit === "juta jiwa") return v.toFixed(1) + " jt jiwa"
  if (unit === "Mt CO2") return v.toFixed(1) + " Mt CO₂"
  return v.toFixed(2) + " " + unit
}

const SOURCE_COLORS: Record<string, string> = {
  "World Bank": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "IMF": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "UN": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
}

export default function WorldBankSection({ series }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" })
  }

  if (!series.length) return null

  return (
    <section className="px-2 sm:px-4 py-2">
      <div className="mx-auto max-w-[1400px]">
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-3 border-b border-border">
            <div>
              <h2 className="section-title">Data Makro Tahunan</h2>
              <p className="text-[9px] text-muted mt-0.5">World Bank · IMF · UN — 30 tahun terakhir</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => scroll("left")}
                className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted hover:text-text hover:border-primary/50 transition-colors text-[11px]">‹</button>
              <button onClick={() => scroll("right")}
                className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted hover:text-text hover:border-primary/50 transition-colors text-[11px]">›</button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex gap-3 px-4 py-3 overflow-x-auto scroll-smooth"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {series.map(s => (
              <div
                key={s.id}
                className="shrink-0 w-[280px] border border-border rounded-lg bg-surface2/30 overflow-hidden"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between px-3 pt-2.5 pb-2 border-b border-border/50">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-extrabold text-text leading-tight">{s.label}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${SOURCE_COLORS[s.source] ?? "text-muted bg-surface2 border-border"}`}>
                        {s.source}
                      </span>
                      <span className="text-[9px] text-muted">{s.unit}</span>
                    </div>
                  </div>
                  <GptButton
                    subject={`indikator "${s.label}" Indonesia berdasarkan data ${s.source}. Analisis: (1) tren jangka panjang dan penyebab perubahan utama, (2) perbandingan dengan rata-rata ASEAN dan global, (3) target dan komitmen Indonesia ke depan, (4) implikasi terhadap kebijakan ekonomi dan sosial, (5) proyeksi 5 tahun ke depan`}
                    className="shrink-0 ml-2"
                  />
                </div>

                {/* Latest value */}
                <div className="px-3 py-2 flex items-baseline gap-2">
                  {s.latest != null ? (
                    <>
                      <span className="text-[20px] font-extrabold text-primary leading-none">
                        {fmtValue(s.latest, s.unit)}
                      </span>
                      {s.change != null && (
                        <span className={`text-[10px] font-bold ${changeClass(s.change)}`}>
                          {fmtChange(s.change)} YoY
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[12px] text-muted">N/A</span>
                  )}
                </div>

                {/* Mini trend chart */}
                {s.points.length > 3 && (
                  <div className="px-2 pb-2">
                    <TrendChart
                      title=""
                      series={[{ data: s.points.map(p => ({ year: p.year, value: p.value })), color: "#3B82F6", label: s.label }]}
                      height={80}
                    />
                  </div>
                )}

                {/* Data table last 5 */}
                <div className="border-t border-border/50">
                  {s.points.slice(-5).reverse().map(p => (
                    <div key={p.year} className="flex items-center justify-between px-3 py-1 border-b border-border/20 last:border-0">
                      <span className="text-[9px] text-muted">{p.year}{p.isProjection ? " (P)" : ""}</span>
                      <span className="text-[10px] font-bold text-text">{fmtValue(p.value, s.unit)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
