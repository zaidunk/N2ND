"use client"
import { useState } from "react"

export default function Navbar() {
  const [gptQ, setGptQ] = useState("")
  const [findQ, setFindQ] = useState("")

  const submitGpt = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gptQ.trim()) return
    const prompt =
      `halo gpt saya dari xolvon.ai mau nanya tentang ${gptQ.trim()}. ` +
      `Tolong berikan analisis komprehensif: (1) penjelasan lengkap dan konteks terkini, ` +
      `(2) data dan angka relevan terbaru, (3) dampak terhadap Indonesia, ` +
      `(4) perspektif pro dan kontra dari berbagai pihak, ` +
      `(5) rekomendasi tindakan atau hal yang perlu diwaspadai`
    window.open(
      `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`,
      "_blank", "noopener,noreferrer"
    )
    setGptQ("")
  }

  const submitFind = (e: React.FormEvent) => {
    e.preventDefault()
    if (!findQ.trim()) return
    ;(window as Window & { find?: (s: string) => boolean }).find?.(findQ.trim())
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-auto min-h-11 max-w-[1400px] items-center gap-2 px-3 py-1.5 flex-wrap sm:flex-nowrap">
        {/* Brand */}
        <div className="shrink-0">
          <p className="text-[13px] font-extrabold text-text leading-none tracking-tight">N2ND</p>
          <p className="text-[8px] text-muted leading-none">Xolvon.ai</p>
        </div>

        {/* Dual search bars */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          {/* GPT search — blue */}
          <form onSubmit={submitGpt} className="flex flex-1 items-center gap-1 min-w-0">
            <input
              value={gptQ}
              onChange={e => setGptQ(e.target.value)}
              placeholder="Tanya GPT..."
              className="min-w-0 flex-1 rounded-lg border border-primary/30 bg-surface2 px-2.5 py-1.5 text-[11px] font-bold text-text placeholder:text-muted/70 focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-extrabold text-white hover:bg-blue-400 transition-colors whitespace-nowrap"
            >GPT</button>
          </form>

          {/* Page find — amber */}
          <form onSubmit={submitFind} className="flex flex-1 items-center gap-1 min-w-0">
            <input
              value={findQ}
              onChange={e => setFindQ(e.target.value)}
              placeholder="Cari di halaman..."
              className="min-w-0 flex-1 rounded-lg border border-amber-500/30 bg-surface2 px-2.5 py-1.5 text-[11px] font-bold text-text placeholder:text-muted/70 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1.5 text-[10px] font-extrabold text-amber-400 hover:bg-amber-500/25 transition-colors whitespace-nowrap"
            >⌘F</button>
          </form>
        </div>

        {/* Badge */}
        <span className="hidden sm:inline shrink-0 rounded border border-border px-2 py-0.5 text-[8px] font-extrabold text-muted tracking-widest uppercase whitespace-nowrap">
          Live · ISR 60s
        </span>
      </div>
    </nav>
  )
}
