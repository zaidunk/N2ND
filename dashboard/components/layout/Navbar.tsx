"use client"
import { useState, useEffect } from "react"
import RefreshButton from "@/components/ui/RefreshButton"
import type { Article } from "@/lib/types"

type G = Window & { __n2nd_articles?: Article[] }

const SOURCE_LABELS: Record<string, string> = {
  antara: "Antara", tempo: "Tempo", detik: "Detik",
  cnn_id: "CNN ID", cnbc_id: "CNBC ID", kompas: "Kompas",
  tribun: "Tribun", kumparan: "Kumparan", liputan6: "Liputan6",
  bbc: "BBC", aljazeera: "Al Jazeera", guardian: "Guardian",
  cna: "CNA", france24: "France24", dw_en: "DW",
}

export default function Navbar() {
  const [gptQ, setGptQ] = useState("")
  const [findQ, setFindQ] = useState("")
  const [results, setResults] = useState<Article[]>([])
  const [showDrop, setShowDrop] = useState(false)
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"))
  }, [])

  const toggleTheme = () => {
    const next = !isLight
    setIsLight(next)
    if (next) {
      document.documentElement.classList.add("light")
      localStorage.setItem("n2nd_theme", "light")
    } else {
      document.documentElement.classList.remove("light")
      localStorage.setItem("n2nd_theme", "dark")
    }
  }

  const submitGpt = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gptQ.trim()) return
    const prompt =
      `halo gpt saya dari xolvon.ai mau nanya tentang ${gptQ.trim()}. ` +
      `Tolong berikan analisis komprehensif: (1) penjelasan lengkap dan konteks terkini, ` +
      `(2) data dan angka relevan terbaru, (3) dampak terhadap Indonesia, ` +
      `(4) perspektif pro dan kontra dari berbagai pihak, ` +
      `(5) rekomendasi tindakan atau hal yang perlu diwaspadai`
    window.open(`https://chat.openai.com/?q=${encodeURIComponent(prompt)}`, "_blank", "noopener,noreferrer")
    setGptQ("")
  }

  const runSearch = (v: string) => {
    setFindQ(v)
    const pool = (window as G).__n2nd_articles ?? []
    if (v.trim().length >= 2) {
      const q = v.toLowerCase()
      const hits = pool
        .filter(a => a.title.toLowerCase().includes(q) || (a.summary?.toLowerCase().includes(q) ?? false))
        .slice(0, 6)
      setResults(hits)
      setShowDrop(hits.length > 0)
    } else {
      setResults([])
      setShowDrop(false)
    }
  }

  const submitFind = (e: React.FormEvent) => {
    e.preventDefault()
    if (!findQ.trim()) return
    window.dispatchEvent(new CustomEvent("n2nd-search", { detail: { q: findQ.trim() } }))
    setShowDrop(false)
    setTimeout(() => document.getElementById("news-section")?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-auto min-h-11 max-w-[1400px] items-center gap-2 px-3 py-1.5 flex-wrap sm:flex-nowrap">
        {/* Brand */}
        <div className="shrink-0">
          <p className="text-[13px] font-extrabold text-text leading-none tracking-tight">N2ND<span className="text-primary">.</span></p>
          <p className="text-[8px] text-muted leading-none">Xolvon.ai</p>
        </div>

        {/* Search bars */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          {/* GPT search */}
          <form onSubmit={submitGpt} className="flex flex-1 items-center gap-1 min-w-0">
            <input
              value={gptQ}
              onChange={e => setGptQ(e.target.value)}
              placeholder="Tanya GPT..."
              className="min-w-0 flex-1 rounded-lg border border-primary/30 bg-surface2 px-2.5 py-1.5 text-[11px] font-bold text-text placeholder:text-muted/70 focus:outline-none focus:border-primary transition-colors"
            />
            <button type="submit" className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-extrabold text-white hover:bg-blue-400 transition-colors whitespace-nowrap">
              GPT
            </button>
          </form>

          {/* Keyword article finder */}
          <form onSubmit={submitFind} className="relative flex flex-1 items-center min-w-0">
            <input
              value={findQ}
              onChange={e => runSearch(e.target.value)}
              onFocus={() => runSearch(findQ)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              placeholder="Cari berita..."
              className="min-w-0 flex-1 rounded-lg border border-amber-500/30 bg-surface2 px-2.5 py-1.5 text-[11px] font-bold text-text placeholder:text-muted/70 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {showDrop && (
              <div className="absolute top-full left-0 right-0 z-[60] mt-0.5 rounded-lg border border-border bg-surface shadow-xl overflow-hidden">
                {results.map((a, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => {
                      window.open(a.link, "_blank", "noopener,noreferrer")
                      setShowDrop(false)
                    }}
                    className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-surface2 transition-colors border-b border-border/30 last:border-0"
                  >
                    <span className="shrink-0 text-[8px] font-extrabold text-muted uppercase tracking-wide mt-0.5 w-10 truncate">
                      {SOURCE_LABELS[a.source_id] ?? a.source_id}
                    </span>
                    <span className="text-[10px] font-bold text-text line-clamp-1">{a.title}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <RefreshButton />
          <button
            onClick={toggleTheme}
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
            title={isLight ? "Dark mode" : "Light mode"}
            className="w-7 h-7 rounded-full border border-border/50 bg-surface2/70 flex items-center justify-center text-[13px] transition-all opacity-70 hover:opacity-100 hover:bg-surface2 hover:scale-110"
          >
            {isLight ? "🌙" : "☀️"}
          </button>
          <a
            href={`https://wa.me/6287888760105?text=${encodeURIComponent("Halo Xolvon.ai! 👋 Saya pengguna N2ND Intelligence Dashboard. Saya tertarik untuk mengetahui lebih lanjut tentang layanan data dan analitik yang Anda tawarkan. Bisakah kita berdiskusi lebih lanjut? Terima kasih!")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[10px] font-extrabold text-white transition-colors whitespace-nowrap"
          >
            Contact Us
          </a>
        </div>
      </div>
    </nav>
  )
}
