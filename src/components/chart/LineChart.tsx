import { fmtTick, linear, niceTicks } from './scale'

export interface LineSeries {
  pts: [number, number][]
  color: string
  label: string
  dashed?: boolean
  /** 선 굵기 (기본 2.2) */
  width?: number
  opacity?: number
}

interface Props {
  xDomain: [number, number]
  yDomain?: [number, number]
  series: LineSeries[]
  markers?: { x: number; y: number; color: string; label?: string; r?: number }[]
  vlines?: { x: number; label: string; color?: string }[]
  hlines?: { y: number; label: string; color?: string }[]
  band?: { from: number; to: number; label: string } | null
  xTitle: string
  yTitle?: string
  ariaLabel: string
  height?: number
}

const W = 640

export function LineChart({ xDomain, yDomain = [0, 1], series, markers = [], vlines = [], hlines = [], band, xTitle, yTitle, ariaLabel, height = 280 }: Props) {
  const H = height
  const m = { l: 50, r: 12, t: 14, b: 52 }
  const x = linear(xDomain[0], xDomain[1], m.l, W - m.r)
  const y = linear(yDomain[0], yDomain[1], H - m.b, m.t)
  const path = (pts: [number, number][]) => pts.map(([a, b], i) => `${i ? 'L' : 'M'}${x(a).toFixed(2)},${y(b).toFixed(2)}`).join('')

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        {band && (
          <g>
            <rect x={x(Math.max(band.from, xDomain[0]))} width={Math.max(0, x(Math.min(band.to, xDomain[1])) - x(Math.max(band.from, xDomain[0])))} y={m.t} height={H - m.b - m.t} fill="var(--c-blue-bg)" />
            <text x={x(Math.max(band.from, xDomain[0])) + 4} y={H - m.b - 6} fontSize={10} fill="var(--c-null)">
              {band.label}
            </text>
          </g>
        )}
        <g className="axis">
          {niceTicks(yDomain[0], yDomain[1], 5).map((t) => (
            <g key={t}>
              <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--c-border-lt)" />
              <text x={m.l - 6} y={y(t) + 4} textAnchor="end">
                {fmtTick(t)}
              </text>
            </g>
          ))}
          <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} />
          {niceTicks(xDomain[0], xDomain[1], 8).map((t) => (
            <text key={t} x={x(t)} y={H - m.b + 18} textAnchor={x(t) > W - m.r - 12 ? 'end' : 'middle'}>
              {fmtTick(t)}
            </text>
          ))}
          <text className="axis-title" x={(m.l + W - m.r) / 2} y={H - 8} textAnchor="middle">
            {xTitle}
          </text>
          {yTitle && (
            <text className="axis-title" transform={`translate(18 ${(m.t + H - m.b) / 2}) rotate(-90)`} textAnchor="middle">
              {yTitle}
            </text>
          )}
        </g>
        {hlines.map((h, k) => (
          <g key={`h${k}`}>
            <line x1={m.l} x2={W - m.r} y1={y(h.y)} y2={y(h.y)} stroke={h.color ?? 'var(--c-text-tertiary)'} strokeDasharray="4 4" />
            <text x={W - m.r - 4} y={y(h.y) - 4} textAnchor="end" fontSize={10} fill={h.color ?? 'var(--c-text-tertiary)'}>
              {h.label}
            </text>
          </g>
        ))}
        {vlines.map((v, k) => (
          <g key={`v${k}`}>
            <line x1={x(v.x)} x2={x(v.x)} y1={m.t} y2={H - m.b} stroke={v.color ?? 'var(--c-text-tertiary)'} strokeDasharray="4 4" />
            <text x={x(v.x) + 4} y={m.t + 10} fontSize={10} fill={v.color ?? 'var(--c-text-tertiary)'}>
              {v.label}
            </text>
          </g>
        ))}
        {series.map((s, k) => (
          <path key={k} d={path(s.pts)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2.2} strokeOpacity={s.opacity ?? 1} strokeDasharray={s.dashed ? '6 4' : undefined} />
        ))}
        {markers.map((mk, k) => (
          <g key={`m${k}`}>
            <circle cx={x(mk.x)} cy={y(mk.y)} r={mk.r ?? 5.5} fill={mk.color} stroke="#fff" strokeWidth={mk.r !== undefined && mk.r < 4 ? 1 : 2} />
            {mk.label && (
              <text x={x(mk.x) > W - 140 ? x(mk.x) - 9 : x(mk.x) + 9} y={y(mk.y) - 8} textAnchor={x(mk.x) > W - 140 ? 'end' : 'start'} fontSize={11} fontWeight={600} fill={mk.color}>
                {mk.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
