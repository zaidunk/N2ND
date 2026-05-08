"use client"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"

interface StreamChannel {
  label: string
  handle: string
  channelId: string
}

const CHANNELS: StreamChannel[] = [
  { label: "Bloomberg TV", handle: "markets", channelId: "UCIALMKvObZNtJ6AmdCLP7Lg" },
  { label: "CNBC", handle: "CNBC", channelId: "UCvJJ_dzjViJCoLf5uKUTwoA" },
  { label: "Al Jazeera", handle: "AlJazeeraEnglish", channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg" },
  { label: "Trans TV", handle: "TRANSTVofficial", channelId: "UCIohHXwCEKxWCLvAguJ-GjA" },
  { label: "Kompas TV", handle: "kompastv", channelId: "UC5BMIWZe9isJXLZZWPWvBlg" },
  { label: "Malaka Project", handle: "MalakaProjectid", channelId: "UCbmCx2xsM1qfk5vyXE9UC8g" },
  { label: "Gita Wirjawan", handle: "gwirjawan", channelId: "UCDaqDYhGmJdrlHr4h9LQ5uw" },
  { label: "Deddy Corbuzier", handle: "corbuzier", channelId: "UCYk4LJI0Pr6RBDWowMm-KUw" },
  { label: "CNN", handle: "CNN", channelId: "UCupvZG-5ko_eiXAupbDfxWw" },
  { label: "DW", handle: "DWNews", channelId: "UCknLrEdhRCp1aegoMqRaCZg" },
  { label: "Sekretariat Presiden", handle: "SekretariatPresiden", channelId: "UC_m_NBgf7ieJBHzb6vvJC5A" },
  { label: "detikcom", handle: "detikcom", channelId: "UCuMAjEaSMj7q7YLf0xW1MjQ" },
  { label: "National Geographic", handle: "NatGeo", channelId: "UCpVm7bg6pXKo1Pr6k5kxG9A" },
  { label: "WION", handle: "WIONews", channelId: "UCWEIPvoxRwn6llPOIn555rQ" },
  { label: "ABC News", handle: "ABCNews", channelId: "UCBi2mrWuNuyYy4gbM6fU18Q" },
  { label: "PBS NewsHour", handle: "PBSNewsHour", channelId: "UC6ZFN9Tx6xh-skXCuRHCDpQ" },
  { label: "Predictive History", handle: "PredictiveHistory", channelId: "UC11aHtNnc5bEPLI4jf6mnYg" },
  { label: "Federal Reserve", handle: "federalreserve", channelId: "UCLd6g5Uu0oPYnq4PBtVJkqQ" },
]

function StreamCard({ pool, initialIdx }: { pool: StreamChannel[]; initialIdx: number }) {
  const [idx, setIdx]       = useState(initialIdx)
  const iframeRef           = useRef<HTMLIFrameElement>(null)

  const ch = pool[idx % pool.length]

  const cycle = useCallback(() => {
    setIdx(i => (i + 8) % pool.length)
  }, [pool.length])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== "https://www.youtube.com") return
      if (e.source !== iframeRef.current?.contentWindow) return
      try {
        const data = JSON.parse(e.data)
        if (data.event === "onStateChange" && data.info === 0) {
          cycle()
        }
      } catch {}
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [cycle])

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "listening" }),
        "https://www.youtube.com"
      )
    }
  }

  if (!ch) return null

  const liveUrl = `https://www.youtube.com/@${ch.handle}/live`
  const embedUrl = `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(ch.channelId)}&autoplay=1&mute=1&rel=0&modestbranding=1&enablejsapi=1`

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-2.5 py-1 border-b border-border">
        <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-slow" />
          <span className="truncate max-w-[100px]" title={ch.label}>{ch.label}</span>
          <span className="text-[8px] text-muted/50 font-normal">(live)</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cycle} title="Ganti channel" className="text-muted hover:text-primary transition-colors">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer"
            className="text-[9px] text-primary hover:underline font-bold">Buka ↗</a>
        </div>
      </div>

      <div className="aspect-video bg-surface2 relative">
        <iframe
          ref={iframeRef}
          key={ch.channelId}
          src={embedUrl}
          className="w-full h-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
          title={`${ch.label} Live`}
        />
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="pt-4 pb-3 px-3">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-3 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight leading-none">
            N2ND<span className="text-primary">.</span>{" "}
            <span className="text-muted text-xl sm:text-2xl font-bold">by Xolvon.ai</span>
          </h1>
          <p className="text-[10px] text-muted mt-1.5 tracking-widest uppercase">
            Intelligence Dashboard · Global & ID News Real-Time
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Link href="/insights" className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[10px] font-extrabold text-primary hover:bg-primary/15 transition-colors">
              N2ND Intelligence
            </Link>
            <Link href="/AttentionBoost" className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[10px] font-extrabold text-amber-400 hover:bg-amber-500/15 transition-colors">
              AttentionBoost
            </Link>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-slow" />
            <span className="text-[9px] font-extrabold text-muted uppercase tracking-widest">Global & Local Realtime Streams</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <StreamCard key={i} pool={CHANNELS} initialIdx={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
