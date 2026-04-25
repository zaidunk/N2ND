"use client"
import { useState } from "react"

const STREAMS = [
  { label: "CNN Indonesia",  channelId: "UCt-ATsKKoRLDPcIKRBpwmzg" },
  { label: "Kompas TV",      channelId: "UCu3OxzFBBBxbSKMLGVAm4NQ" },
  { label: "CNBC Indonesia", channelId: "UCqJGKKkwRoLlP4yTaWMhEbA" },
]

export default function Hero() {
  const [q, setQ] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    window.open(
      `https://chat.openai.com/?q=${encodeURIComponent("halo gpt saya dari xolvon.ai mau nanya tentang " + q)}`,
      "_blank", "noopener,noreferrer"
    )
  }

  return (
    <section className="pt-8 pb-6 px-4">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-5 text-center">
          <h1 className="text-4xl font-extrabold text-text tracking-tight leading-none">
            N2ND{" "}
            <span className="text-muted text-2xl font-bold">by Xolvon.ai</span>
          </h1>
          <p className="text-[11px] text-muted mt-2 tracking-widest uppercase">
            Intelligence Dashboard · Data Indonesia Real-Time
          </p>
        </div>

        <form onSubmit={submit} className="mb-6 flex gap-2 max-w-2xl mx-auto">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tanya GPT tentang topik apapun — ekonomi, saham, berita..."
            className="input flex-1 text-sm"
          />
          <button type="submit" className="btn-primary shrink-0 text-sm">
            Tanya GPT
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STREAMS.map(s => (
            <div key={s.channelId} className="card overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] font-extrabold text-muted border-b border-border flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-slow" />
                {s.label} Live
              </div>
              <div className="aspect-video bg-surface2">
                <iframe
                  src={`https://www.youtube.com/embed/live_stream?channel=${s.channelId}&autoplay=0`}
                  className="w-full h-full"
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${s.label} Live`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
