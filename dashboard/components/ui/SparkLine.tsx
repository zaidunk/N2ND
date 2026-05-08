interface Props { data: number[]; positive?: boolean; className?: string }

export default function SparkLine({ data, positive, className = "" }: Props) {
  if (!data || data.length < 2) return null
  const W = 80, H = 24
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x},${y}`
  })
  const linePath = `M ${pts.join(" L ")}`
  const areaPath = `M 0,${H} L ${pts.join(" L ")} L ${W},${H} Z`
  const color = positive === true ? "#10B981" : positive === false ? "#F85149" : "#3B82F6"

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`w-full h-6 overflow-visible ${className}`} preserveAspectRatio="none">
      <path d={areaPath} fill={color} fillOpacity="0.12" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
