"use client"
import { useEffect, useState } from "react"

export default function PromoPopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem("n2nd-promo-seen")) {
      const t = setTimeout(() => setOpen(true), 2500)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    sessionStorage.setItem("n2nd-promo-seen", "1")
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer"
      onClick={dismiss}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden cursor-default"
        onClick={dismiss}
        style={{
          background: "linear-gradient(160deg, rgba(13,17,23,0.97) 0%, rgba(22,27,39,0.99) 100%)",
          border: "1px solid rgba(59,130,246,0.2)",
          boxShadow: "0 0 80px rgba(59,130,246,0.12), 0 30px 70px rgba(0,0,0,0.85)",
        }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-muted hover:text-text transition-colors z-10"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pt-7 pb-6">
          {/* Badge */}
          <div className="flex justify-center mb-4">
            <span className="text-[9px] font-extrabold tracking-[0.2em] uppercase px-3 py-1 rounded-full border border-blue-500/25 text-blue-400 bg-blue-500/10">
              N2ND · by Xolvon.ai
            </span>
          </div>

          {/* Title */}
          <h2 className="text-[21px] font-extrabold text-center text-text tracking-tight leading-tight mb-1">
            DRAW YOUR OWN
          </h2>
          <h2 className="text-[21px] font-extrabold text-center tracking-tight leading-tight mb-3"
            style={{ background: "linear-gradient(90deg, #3B82F6, #10B981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            DASHBOARD
          </h2>

          {/* Value props */}
          <div className="flex flex-col gap-1.5 mb-5">
            {["Build the exact dashboard your team needs", "Custom layouts, workflows & analytics", "Designed for speed, flexibility, and control"].map(line => (
              <div key={line} className="flex items-start gap-2">
                <span className="mt-0.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                <p className="text-[10px] text-muted leading-snug">{line}</p>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="rounded-xl border border-border/50 bg-surface2/40 p-3">
              <p className="text-[9px] text-muted mb-1.5">One-time setup</p>
              <p className="text-[26px] font-extrabold leading-none"
                style={{ background: "linear-gradient(135deg, #F59E0B, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                899K
              </p>
              <p className="text-[8px] text-muted mt-1.5 leading-relaxed">Lifetime access<br />Multiple dashboards</p>
            </div>
            <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-[7px] font-extrabold px-2 py-0.5 rounded-bl-lg">ENTERPRISE</div>
              <p className="text-[9px] text-muted mb-1.5">Custom pipeline</p>
              <p className="text-[20px] font-extrabold leading-none text-primary">4.399K</p>
              <p className="text-[8px] text-muted">/year</p>
              <p className="text-[8px] text-muted mt-1 leading-relaxed">Scalable & secure<br />Tailored for your team</p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={dismiss}
            className="w-full py-2.5 rounded-xl font-extrabold text-[11px] tracking-widest text-white transition-all uppercase"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)",
              boxShadow: "0 0 24px rgba(59,130,246,0.35)",
            }}
          >
            Start Custom Setup
          </button>
          <p className="text-center text-[8px] text-muted/60 mt-2.5">Tap anywhere to close</p>
        </div>
      </div>
    </div>
  )
}
