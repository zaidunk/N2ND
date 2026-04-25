"use client"

import { useState } from "react"
import type { Article } from "@/lib/types"

const SOURCE_COLORS: Record<string, string> = {
  antara:  "text-blue-400",
  kompas:  "text-emerald-400",
  tempo:   "text-amber-400",
  reuters: "text-red-400",
  bbc:     "text-purple-400",
  detik:   "text-orange-400",
}

function ago(dateStr?: string): string {
  if (!dateStr) return ""
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor(diff / 60_000)
    if (m < 60) return `${m}m`
    if (h < 24) return `${h}j`
    return `${Math.floor(h / 24)}h`
  } catch { return "" }
}

interface Props {
  articles: Article[]
  market?: { ihsg?: number; ihsgChange?: number; usdIdr?: number; btcUsd?: number; btcChange?: number; biRate?: number }
}

export default function NewsMonitor({ articles, market }: Props) {
  const [filter, setFilter] = useState<string>("ALL")

  const sources = ["ALL", ...Array.from(new Set(articles.map(a => a.source_id.toUpperCase())))]
  const visible = filter === "ALL" ? articles : articles.filter(a => a.source_id.toUpperCase() === filter)

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Monitor header */}
      <div className="flex items-center gap-2 border-b border-border bg-surface2 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-extrabold text-text tracking-widest uppercase">Live Intelligence</span>
        <span className="ml-auto text-[9px] text-muted">{articles.length} artikel</span>
      </div>

      {/* Source filter tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border overflow-x-auto">
        {sources.slice(0, 8).map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded px-2 py-0.5 text-[9px] font-extrabold transition-colors ${
              filter === s ? "bg-primary text-white" : "text-muted hover:text-text"
            }`}
          >{s}</button>
        ))}
      </div>

      {/* Market ticker strip */}
      {market && (
        <div className="flex items-center gap-4 px-3 py-1 border-b border-border bg-surface2 overflow-x-auto">
          {market.ihsg && (
            <span className="shrink-0 text-[10px]">
              <span className="text-muted">IHSG </span>
              <span className="font-extrabold text-text">{market.ihsg.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
              {market.ihsgChange != null && (
                <span className={`ml-1 ${market.ihsgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {market.ihsgChange >= 0 ? "+" : ""}{market.ihsgChange.toFixed(2)}%
                </span>
              )}
            </span>
          )}
          {market.usdIdr && (
            <span className="shrink-0 text-[10px]">
              <span className="text-muted">USD/IDR </span>
              <span className="font-extrabold text-text">Rp {market.usdIdr.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
            </span>
          )}
          {market.btcUsd && (
            <span className="shrink-0 text-[10px]">
              <span className="text-muted">BTC </span>
              <span className="font-extrabold text-text">${market.btcUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              {market.btcChange != null && (
                <span className={`ml-1 ${market.btcChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {market.btcChange >= 0 ? "+" : ""}{market.btcChange.toFixed(2)}%
                </span>
              )}
            </span>
          )}
          {market.biRate && (
            <span className="shrink-0 text-[10px]">
              <span className="text-muted">BI Rate </span>
              <span className="font-extrabold text-text">{market.biRate}%</span>
            </span>
          )}
        </div>
      )}

      {/* News list */}
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted">Memuat berita…</div>
        ) : visible.map((a, i) => (
          <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-2.5 px-3 py-2 hover:bg-surface2 transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-text line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                {a.title}
              </p>
              {a.summary && (
                <p className="mt-0.5 text-[9px] text-muted line-clamp-1">{a.summary}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-[9px] font-extrabold uppercase ${SOURCE_COLORS[a.source_id] ?? "text-muted"}`}>
                {a.source_id}
              </p>
              <p className="text-[9px] text-muted">{ago(a.published)}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
