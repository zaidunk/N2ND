export interface BarDataPoint { label: string; value: number }

export function buildPath(
  points: { year: number; value: number }[],
  minY: number, maxY: number,
  w: number, h: number
): string {
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
