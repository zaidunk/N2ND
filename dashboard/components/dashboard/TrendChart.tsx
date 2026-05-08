import type { TrendPoint } from "@/lib/types"

interface Series {
  data: TrendPoint[]
  color: string
  label: string
}

interface Props {
  title: string
  series: Series[]
  width?: number
  height?: number
}

function buildPath(points: TrendPoint[], minY: number, maxY: number, w: number, h: number): string {
  const pad = { t: 8, b: 20 }
  const chartH = h - pad.t - pad.b
  const rangeY = maxY - minY || 1

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w
    const y = pad.t + (1 - (p.value - minY) / rangeY) * chartH
    return [x, y] as [number, number]
  })

  return coords.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`
    const [px, py] = coords[i - 1]
    const cx = (px + x) / 2
    return `${d} C${cx},${py} ${cx},${y} ${x},${y}`
  }, "")
}

export default function TrendChart({ title, series, width = 460, height = 180 }: Props) {
  const allValues = series.flatMap(s => s.data.map(d => d.value))
  const minY = Math.min(...allValues)
  const maxY = Math.max(...allValues)
  const years = series[0]?.data.map(d => d.year) ?? []

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <p className="mb-2 text-[9px] font-extrabold uppercase tracking-widest text-muted">{title}</p>
      <div className="flex items-center gap-3 mb-2">
        {series.map(s => (
          <span key={s.label} className="flex items-center gap-1 text-[9px] font-bold text-muted">
            <span className="inline-block h-1.5 w-5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        {series.map(s => (
          <path key={s.label}
            d={buildPath(s.data, minY, maxY, width, height)}
            fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round"
          />
        ))}
        {years.filter((_, i) => i % 2 === 0).map(y => {
          const idx = years.indexOf(y)
          const x = (idx / (years.length - 1)) * width
          return (
            <text key={y} x={x} y={height - 4} textAnchor="middle"
              fontSize={8} fill="rgb(107 123 182)" fontWeight={700}>{y}</text>
          )
        })}
      </svg>
    </div>
  )
}
