"use client"

import { useState, useMemo } from "react"
import type { SearchBundle, UseCase, AITarget } from "@/lib/types"
import { USE_CASE_META, AI_TARGETS, buildExportPrompt, copyToClipboard, openAI, DEFAULT_OPTIONS } from "@/lib/export-formula"
import { Check, Copy, ExternalLink } from "lucide-react"

interface ExportBuilderProps {
  bundle: SearchBundle
}

export default function ExportBuilder({ bundle }: ExportBuilderProps) {
  const [useCase, setUseCase]         = useState<UseCase>("analisis_berita")
  const [includeArticles, setArticles] = useState(true)
  const [includeBPS, setBPS]           = useState(true)
  const [includeMarket, setMarket]     = useState(true)
  const [includeEntities, setEntities] = useState(true)
  const [maxArticles, setMaxArticles]  = useState(8)
  const [copied, setCopied]            = useState(false)

  const prompt = useMemo(() => buildExportPrompt(bundle, {
    useCase, includeArticles, includeBPS, includeMarket, includeEntities, maxArticles,
  }), [bundle, useCase, includeArticles, includeBPS, includeMarket, includeEntities, maxArticles])

  async function handleCopy() {
    const ok = await copyToClipboard(prompt)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const stats = bundle.context_bundle
  const hasNews    = (stats.news?.length ?? 0) > 0
  const hasBPS     = (stats.stats?.length ?? 0) > 0
  const hasMarket  = !!stats.market_signals
  const hasEntities = (stats.entity_graph?.entities?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Use case tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(USE_CASE_META) as [UseCase, typeof USE_CASE_META[UseCase]][]).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setUseCase(key)}
            className={`rounded-lg border px-4 py-2 text-xs font-extrabold transition-all ${
              useCase === key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted hover:border-primary/50 hover:text-text"
            }`}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Controls */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="card flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted">Konten</h3>
            <label className={`flex cursor-pointer items-center justify-between ${!hasNews ? "opacity-40" : ""}`}>
              <span className="text-sm font-bold text-text">
                Berita ({stats.news?.length ?? 0})
              </span>
              <input type="checkbox" checked={includeArticles && hasNews} disabled={!hasNews}
                onChange={e => setArticles(e.target.checked)} className="accent-primary" />
            </label>
            {includeArticles && hasNews && (
              <div className="flex items-center gap-2 pl-2">
                <span className="text-xs font-bold text-muted">Max artikel:</span>
                <select
                  value={maxArticles}
                  onChange={e => setMaxArticles(Number(e.target.value))}
                  className="input py-1 text-xs"
                >
                  {[3, 5, 8, 10, 15].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}
            <label className={`flex cursor-pointer items-center justify-between ${!hasBPS ? "opacity-40" : ""}`}>
              <span className="text-sm font-bold text-text">Data BPS ({stats.stats?.length ?? 0})</span>
              <input type="checkbox" checked={includeBPS && hasBPS} disabled={!hasBPS}
                onChange={e => setBPS(e.target.checked)} className="accent-primary" />
            </label>
            <label className={`flex cursor-pointer items-center justify-between ${!hasMarket ? "opacity-40" : ""}`}>
              <span className="text-sm font-bold text-text">Sinyal Pasar</span>
              <input type="checkbox" checked={includeMarket && hasMarket} disabled={!hasMarket}
                onChange={e => setMarket(e.target.checked)} className="accent-primary" />
            </label>
            <label className={`flex cursor-pointer items-center justify-between ${!hasEntities ? "opacity-40" : ""}`}>
              <span className="text-sm font-bold text-text">Entitas ({stats.entity_graph?.entities?.length ?? 0})</span>
              <input type="checkbox" checked={includeEntities && hasEntities} disabled={!hasEntities}
                onChange={e => setEntities(e.target.checked)} className="accent-primary" />
            </label>
          </div>

          {/* AI targets */}
          <div className="card flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted">Kirim ke AI</h3>
            <div className="flex flex-col gap-2">
              {(Object.entries(AI_TARGETS) as [AITarget, typeof AI_TARGETS[AITarget]][]).map(([key, target]) => (
                <button
                  key={key}
                  onClick={() => { handleCopy(); openAI(key) }}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface2 px-4 py-2.5 text-sm font-extrabold text-text transition-all hover:border-primary/50 hover:bg-primary/10"
                >
                  <span>{target.icon} {target.label}</span>
                  <ExternalLink size={13} className="text-muted" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Tersalin!" : "Salin Prompt"}
          </button>
        </div>

        {/* Right: Prompt preview */}
        <div className="lg:col-span-3">
          <div className="card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted">Preview Prompt</h3>
              <span className="text-xs font-bold text-muted">{prompt.length} karakter</span>
            </div>
            <pre className="prompt-preview max-h-[60vh] overflow-y-auto text-xs leading-relaxed">
              {prompt}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
