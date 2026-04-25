import type { BarDataPoint } from "@/lib/svg-utils"

interface Props {
  data: BarDataPoint[]
  barHeight?: number
  colorFn?: (v: number) => string
  unit?: string
  decimals?: number
}

export default function SvgBarChart({ data, barHeight = 16, colorFn, unit = "", decimals = 1 }: Props) {
  const max = Math.max(...data.map(d => Math.abs(d.value)), 0.001)
  const labelW = 130
  const barMaxW = 260
  const valW = 60
  const totalW = labelW + barMaxW + valW
  const gap = 3
  const rowH = barHeight + gap
  const totalH = data.length * rowH

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full" style={{ height: totalH }}>
      {data.map((d, i) => {
        const y = i * rowH
        const bw = Math.max((Math.abs(d.value) / max) * barMaxW, 1)
        const color = colorFn ? colorFn(d.value) : "#3B82F6"
        const isNeg = d.value < 0
        return (
          <g key={`${d.label}-${i}`}>
            <text x={labelW - 4} y={y + barHeight * 0.72} textAnchor="end"
              fontSize={9} fill="#6B7BB6" fontWeight={700} fontFamily="system-ui">
              {d.label}
            </text>
            <rect
              x={labelW} y={y} width={bw} height={barHeight - 1} rx={2}
              fill={isNeg ? "#F85149" : color} fillOpacity={0.75}
            />
            <text x={labelW + bw + 3} y={y + barHeight * 0.72}
              fontSize={9} fill="#EEF2FF" fontWeight={700} fontFamily="system-ui">
              {isNeg ? "" : ""}{d.value.toFixed(decimals)}{unit}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
