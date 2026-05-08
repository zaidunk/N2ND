"use client"
import { useState, useEffect } from "react"

const COOLDOWN_MS = 5 * 60 * 1000
const LS_KEY = "n2nd_last_refresh"

export default function RefreshButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "wait">("idle")
  const [wait, setWait] = useState(0)

  useEffect(() => {
    const last = parseInt(localStorage.getItem(LS_KEY) ?? "0")
    const elapsed = Date.now() - last
    if (elapsed < COOLDOWN_MS) {
      setState("wait")
      setWait(Math.ceil((COOLDOWN_MS - elapsed) / 1000))
    }
  }, [])

  useEffect(() => {
    if (state !== "wait") return
    const t = setInterval(() => {
      setWait(w => {
        if (w <= 1) { setState("idle"); clearInterval(t); return 0 }
        return w - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [state])

  const handleRefresh = async () => {
    if (state !== "idle") return
    setState("loading")
    try {
      const r = await fetch("/api/revalidate", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      })
      const j = await r.json()
      if (j.rateLimited) {
        setWait(Math.ceil(j.waitMs / 1000))
        setState("wait")
      } else {
        localStorage.setItem(LS_KEY, String(Date.now()))
        setState("done")
        setTimeout(() => window.location.reload(), 800)
      }
    } catch {
      setState("idle")
    }
  }

  const base = "hidden sm:inline shrink-0 rounded border px-2 py-0.5 text-[8px] font-extrabold tracking-widest uppercase whitespace-nowrap"

  if (state === "loading")
    return <span className={`${base} border-border text-muted`}>Loading…</span>
  if (state === "done")
    return <span className={`${base} border-emerald-500/30 text-emerald-400`}>Updated ✓</span>
  if (state === "wait") {
    const m = Math.floor(wait / 60)
    const s = String(wait % 60).padStart(2, "0")
    return <span className={`${base} border-border text-muted`}>{m}:{s}</span>
  }

  return (
    <button
      onClick={handleRefresh}
      className={`${base} border-border text-muted hover:border-primary/50 hover:text-primary transition-colors cursor-pointer`}
    >
      ↻ Refresh
    </button>
  )
}
