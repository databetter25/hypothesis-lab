import { useId, useMemo } from 'react'
import { fmtTick, linear, niceTicks } from './scale'

export interface Curve {
  fn: (x: number) => number
  color: string
  fill: string
  label: string
}

export interface Shade {
  curve: number
  from: number
  to: number
  kind: 'reject' | 'pval' | 'solid'
}

interface Props {
  domain: [number, number]
  curves: Curve[]
  shades?: Shade[]
  vlines?: { x: number; label: string; color?: string; dashed?: boolean }[]
  hist?: { values: ArrayLike<number>; bins?: number } | null
  ariaLabel: string
  xTitle?: string
  height?: number
  yMaxHint?: number
}

const W = 640
const STEPS = 240

export function ContinuousChart({ domain, curves, shades = [], vlines = [], hist, ariaLabel, xTitle, height = 290, yMaxHint }: Props) {
  const uid = useId().replace(/:/g, '')
  const H = height
  const m = { l: 46, r: 10, t: 14, b: xTitle ? 52 : 38 }
  const [d0, d1] = domain

  const histBins = useMemo(() => {
    if (!hist || hist.values.length === 0) return null
    const nb = hist.bins ?? 40
    const w = (d1 - d0) / nb
    const counts = new Array<number>(nb).fill(0)
    for (let i = 0; i < hist.values.length; i++) {
      const k = Math.floor((hist.values[i] - d0) / w)
      if (k >= 0 && k < nb) counts[k]++
    }
    const N = hist.values.length
    return counts.map((c, k) => ({ x0: d0 + k * w, x1: d0 + (k + 1) * w, dens: c / (N * w) }))
  }, [hist, d0, d1])

  const samples = useMemo(
    () =>
      curves.map((c) => {
        const pts: [number, number][] = []
        for (let i = 0; i <= STEPS; i++) {
          const xv = d0 + ((d1 - d0) * i) / STEPS
          pts.push([xv, c.fn(xv)])
        }
        return pts
      }),
    [curves, d0, d1],
  )

  const yMax = useMemo(() => {
    let mx = yMaxHint ?? 0
    for (const s of samples) for (const [, v] of s) if (Number.isFinite(v)) mx = Math.max(mx, v)
    if (histBins) for (const b of histBins) mx = Math.max(mx, b.dens)
    return mx * 1.1 || 1
  }, [samples, histBins, yMaxHint])

  const x = linear(d0, d1, m.l, W - m.r)
  const y = linear(0, yMax, H - m.b, m.t)
  const cy = (v: number) => y(Math.min(Number.isFinite(v) ? v : yMax, yMax))
  const path = (pts: [number, number][]) => pts.map(([a, b], i) => `${i ? 'L' : 'M'}${x(a).toFixed(2)},${cy(b).toFixed(2)}`).join('')

  const shadePath = (s: Shade) => {
    const a = Math.max(d0, s.from)
    const b = Math.min(d1, s.to)
    if (b <= a) return null
    const c = curves[s.curve]
    const n = 80
    let d = `M${x(a)},${y(0)}`
    for (let i = 0; i <= n; i++) {
      const xv = a + ((b - a) * i) / n
      d += `L${x(xv).toFixed(2)},${cy(c.fn(xv)).toFixed(2)}`
    }
    d += `L${x(b)},${y(0)}Z`
    return d
  }

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        <defs>
          <pattern id={`hatch-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--c-reject)" strokeWidth="2" />
          </pattern>
          <pattern id={`dots-${uid}`} width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.1" fill="var(--c-pval)" />
          </pattern>
        </defs>
        <g className="axis">
          {niceTicks(0, yMax, 4).map((t) => (
            <g key={t}>
              <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--c-border-lt)" />
              <text x={m.l - 6} y={y(t) + 4} textAnchor="end">
                {fmtTick(t)}
              </text>
            </g>
          ))}
          <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} />
          {niceTicks(d0, d1, 7).map((t) => (
            <text key={t} x={x(t)} y={H - m.b + 18} textAnchor={x(t) > W - m.r - 12 ? 'end' : 'middle'}>
              {fmtTick(t)}
            </text>
          ))}
          {xTitle && (
            <text className="axis-title" x={(m.l + W - m.r) / 2} y={H - 6} textAnchor="middle">
              {xTitle}
            </text>
          )}
        </g>

        {histBins?.map((b, k) =>
          b.dens > 0 ? <rect key={k} x={x(b.x0) + 0.5} width={Math.max(x(b.x1) - x(b.x0) - 1, 0.5)} y={y(b.dens)} height={H - m.b - y(b.dens)} fill="var(--c-sim)" /> : null,
        )}

        {curves.map((c, k) => (
          <path key={`f${k}`} d={`${path(samples[k])}L${x(d1)},${y(0)}L${x(d0)},${y(0)}Z`} fill={c.fill} stroke="none" />
        ))}
        {shades.map((s, k) => {
          const d = shadePath(s)
          if (!d) return null
          const fill = s.kind === 'reject' ? `url(#hatch-${uid})` : s.kind === 'pval' ? `url(#dots-${uid})` : curves[s.curve].fill
          return <path key={`s${k}`} d={d} fill={fill} opacity={s.kind === 'solid' ? 1 : 0.9} />
        })}
        {curves.map((c, k) => (
          <path key={`c${k}`} d={path(samples[k])} fill="none" stroke={c.color} strokeWidth={2} />
        ))}

        {vlines.map((v, k) =>
          v.x >= d0 && v.x <= d1 ? (
            <g key={`v${k}`}>
              <line x1={x(v.x)} x2={x(v.x)} y1={m.t - 4} y2={H - m.b} stroke={v.color ?? 'var(--c-obs)'} strokeWidth={2} strokeDasharray={v.dashed === false ? undefined : '5 4'} />
              <text x={x(v.x) + 5} y={m.t + 6 + k * 13} fontSize={11} fill={v.color ?? 'var(--c-obs)'} fontWeight={600}>
                {v.label}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </div>
  )
}
