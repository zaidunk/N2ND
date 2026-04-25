import type { BPSIndicator } from "@/lib/types"

const borderMap = {
  green: "border-emerald-500/30 hover:border-emerald-400/50",
  red:   "border-red-500/30 hover:border-red-400/50",
  blue:  "border-blue-500/30 hover:border-blue-400/50",
  amber: "border-amber-500/30 hover:border-amber-400/50",
}

const labelMap = {
  green: "text-emerald-400",
  red:   "text-red-400",
  blue:  "text-blue-400",
  amber: "text-amber-400",
}

const trendMap = {
  green: "text-emerald-400",
  red:   "text-red-400",
  blue:  "text-blue-400",
  amber: "text-amber-400",
}

export default function StatCard({ label, value, sub, trend, trendUp, color }: BPSIndicator) {
  return (
    <div className={`rounded-lg border bg-surface px-3 py-2.5 transition-colors ${borderMap[color]}`}>
      <p className={`text-[9px] font-extrabold uppercase tracking-widest ${labelMap[color]}`}>{label}</p>
      <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-text leading-none">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted">{sub}</p>
      <p className={`mt-1 text-[9px] font-bold ${trendMap[color]}`}>{trend}</p>
    </div>
  )
}
