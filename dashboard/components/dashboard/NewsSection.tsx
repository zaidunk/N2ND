"use client"
import { useState } from "react"
import type { Article } from "@/lib/types"
import GptButton from "@/components/ui/GptButton"

interface Props { articles: Article[] }

const SOURCE_LABELS: Record<string, string> = {
  antara:    "Antara",
  tempo:     "Tempo",
  detik:     "Detik",
  cnn_id:    "CNN ID",
  cnbc_id:   "CNBC ID",
  tribun:    "Tribun",
  kumparan:  "Kumparan",
  bbc:       "BBC",
  aljazeera: "Al Jazeera",
}

function timeAgo(pub?: string): string {
  if (!pub) return ""
  const d = new Date(pub)
  if (isNaN(d.getTime())) return ""
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}j lalu`
  return `${Math.floor(hrs / 24)}h lalu`
}

export default function NewsSection({ articles }: Props) {
  const sources = Array.from(new Set(articles.map(a => a.source_id))).filter(s => SOURCE_LABELS[s])
  const [filter, setFilter] = useState<string>("all")

  const filtered = filter === "all" ? articles : articles.filter(a => a.source_id === filter)

  return (
    <section className="px-4 py-4">
      <div className="mx-auto max-w-[1400px]">
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
            <h2 className="text-sm font-extrabold text-text">Berita Terkini</h2>
            <span className="text-[9px] text-muted">9 sumber · 30 hari</span>
          </div>

          <div className="flex gap-1 px-4 pt-2 pb-0 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setFilter("all")}
              className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                filter === "all" ? "bg-primary/15 text-primary border-primary/30" : "border-border text-muted hover:text-text"
              }`}
            >Semua</button>
            {sources.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                  filter === s ? "bg-primary/15 text-primary border-primary/30" : "border-border text-muted hover:text-text"
                }`}
              >
                {SOURCE_LABELS[s] ?? s}
              </button>
            ))}
          </div>

          <div className="divide-y divide-border">
            {filtered.slice(0, 30).map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-surface2/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-bold text-text hover:text-primary transition-colors line-clamp-2 leading-snug"
                  >
                    {a.title}
                  </a>
                  {a.summary && (
                    <p className="text-[10px] text-muted mt-0.5 line-clamp-2 font-normal leading-relaxed">
                      {a.summary}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wide">
                      {SOURCE_LABELS[a.source_id] ?? a.source_id}
                    </span>
                    {a.published && (
                      <span className="text-[9px] text-muted">{timeAgo(a.published)}</span>
                    )}
                  </div>
                </div>
                <GptButton subject={a.title} className="mt-0.5" />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-muted text-xs">
                Tidak ada artikel dari sumber ini saat ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
