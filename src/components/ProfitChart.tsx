import { dateText, num, signed } from '../lib/format'
import type { ProfitPoint } from '../lib/derive'

const W = 1100
const H = 260
const PAD = { l: 56, r: 12, t: 12, b: 28 }

/** cumulative profit representation */
export default function ProfitChart({ points }: { points: ProfitPoint[] }) {
  if (!points.length) return <div className="state muted">No completed trades yet.</div>

  const series = points.length === 1 ? [{ date: new Date(points[0].date.getTime() - 86400000), value: 0 }, ...points] : points
  const values = series.map((p) => p.value)
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  const span = max - min || 1
  const x = (i: number) => PAD.l + (i / (series.length - 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b)

  const line = series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(series.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`
  const ticks = [min, min + span / 2, max]
  const last = series[series.length - 1]

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cumulative profit, currently ${signed(last.value)} coins`}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line className="chart__grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
          <text className="chart__label" x={PAD.l - 8} y={y(t) + 4} textAnchor="end">
            {num(t)}
          </text>
        </g>
      ))}
      <line className="chart__zero" x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} />
      <path className="chart__area" d={area} />
      <path className="chart__line" d={line} fill="none" />
      <circle className="chart__dot" cx={x(series.length - 1)} cy={y(last.value)} r="4" />
      <text className="chart__label" x={PAD.l} y={H - 6}>
        {dateText(series[0].date)}
      </text>
      <text className="chart__label" x={W - PAD.r} y={H - 6} textAnchor="end">
        {dateText(last.date)}
      </text>
    </svg>
  )
}
