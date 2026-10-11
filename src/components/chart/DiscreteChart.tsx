import { useId, useMemo } from 'react'
import { fmtTick, linear, niceTicks } from './scale'
import { fmtP } from '../../lib/format'

export interface DiscreteSeries {
  values: ArrayLike<number>
  color: string
  label: string
}

interface Props {
  /** 값 라벨 (길이 = 막대 수) */
  labels: (string | number)[]
  /** 이론 분포 (선 막대). 2개면 나란히 */
  theory: DiscreteSeries[]
  /** 시뮬레이션 상대빈도 (채운 막대) */
  sim?: ArrayLike<number> | null
  /** 검정함수 φ: 기각역 빗금과 축 아래 띠 */
  phi?: ArrayLike<number>
  /** p-값 영역 */
  pRegion?: ArrayLike<boolean>
  observed?: number | null
  onToggle?: (i: number) => void
  ariaLabel: string
  xTitle?: string
  /** 확률이 매우 작은 양 끝을 잘라 보여 줌 */
  trim?: boolean
  height?: number
}

const W = 640

export function DiscreteChart({ labels, theory, sim, phi, pRegion, observed, onToggle, ariaLabel, xTitle, trim = true, height = 290 }: Props) {
  const uid = useId().replace(/:/g, '')
  const K = labels.length
  const H = height
  const m = { l: 46, r: 10, t: 14, b: xTitle ? 52 : 38 }

  const [lo, hi] = useMemo(() => {
    if (!trim || K <= 30) return [0, K - 1]
    let mx = 0
    for (const s of theory) for (let i = 0; i < K; i++) mx = Math.max(mx, s.values[i])
    const thr = mx * 1e-4
    let a = 0
    let b = K - 1
    const keep = (i: number) =>
      theory.some((s) => s.values[i] > thr) || (sim ? sim[i] > 0 : false) || i === observed
    while (a < b && !keep(a)) a++
    while (b > a && !keep(b)) b--
    return [Math.max(0, a - 1), Math.min(K - 1, b + 1)]
  }, [K, theory, sim, observed, trim])

  const count = hi - lo + 1
  const yMax = useMemo(() => {
    let mx = 0
    for (const s of theory) for (let i = lo; i <= hi; i++) mx = Math.max(mx, s.values[i])
    if (sim) for (let i = lo; i <= hi; i++) mx = Math.max(mx, sim[i])
    return mx * 1.12 || 1
  }, [theory, sim, lo, hi])

  const x = linear(lo - 0.5, hi + 0.5, m.l, W - m.r)
  const y = linear(0, yMax, H - m.b, m.t)
  const band = (W - m.l - m.r) / count
  const yTicks = niceTicks(0, yMax, 4)
  const labelEvery = Math.max(1, Math.ceil(count / 14))
  const nT = theory.length
  const barW = nT === 1 ? band * 0.62 : (band * 0.8) / nT

  const idx = Array.from({ length: count }, (_, k) => lo + k)

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role={onToggle ? 'group' : 'img'} aria-label={ariaLabel}>
        <defs>
          <pattern id={`hatch-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--c-reject)" strokeWidth="2" />
          </pattern>
          <pattern id={`dots-${uid}`} width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.1" fill="var(--c-pval)" />
          </pattern>
        </defs>

        <g className="axis">
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--c-border-lt)" />
              <text x={m.l - 6} y={y(t) + 4} textAnchor="end">
                {fmtTick(t)}
              </text>
            </g>
          ))}
          <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} />
          {idx.map((i) =>
            (i - lo) % labelEvery === 0 || i === observed ? (
              <text key={i} x={x(i)} y={H - m.b + 24} textAnchor="middle" fontWeight={i === observed ? 700 : 400}>
                {labels[i]}
              </text>
            ) : null,
          )}
          {xTitle && (
            <text className="axis-title" x={(m.l + W - m.r) / 2} y={H - 6} textAnchor="middle">
              {xTitle}
            </text>
          )}
        </g>

        {/* 시뮬레이션 상대빈도 */}
        {sim &&
          idx.map((i) =>
            sim[i] > 0 ? (
              <rect key={`s${i}`} x={x(i) - band * 0.42} width={band * 0.84} y={y(sim[i])} height={H - m.b - y(sim[i])} fill="var(--c-sim)" rx={1.5} />
            ) : null,
          )}

        {/* 이론 분포 */}
        {theory.map((s, k) =>
          idx.map((i) => {
            const v = s.values[i]
            if (!(v > 0)) return null
            const bx = x(i) - (nT * barW) / 2 + k * barW
            const top = y(v)
            const h = H - m.b - top
            const ph = phi ? phi[i] : 0
            const pr = pRegion ? pRegion[i] : false
            return (
              <g key={`t${k}-${i}`}>
                <rect x={bx} y={top} width={Math.max(barW - 1, 1)} height={h} fill={k === 0 ? 'var(--c-null-fill)' : 'var(--c-alt-fill)'} stroke={s.color} strokeWidth={1.2} />
                {pr && k === 0 && <rect x={bx} y={top} width={Math.max(barW - 1, 1)} height={h} fill={`url(#dots-${uid})`} />}
                {ph > 0 && <rect x={bx} y={top} width={Math.max(barW - 1, 1)} height={h} fill={`url(#hatch-${uid})`} opacity={0.35 + 0.65 * ph} />}
              </g>
            )
          }),
        )}

        {/* 기각역 띠 */}
        {phi &&
          idx.map((i) =>
            phi[i] > 0 ? (
              <rect key={`r${i}`} x={x(i) - band / 2} width={band} y={H - m.b + 2} height={7} fill="var(--c-reject)" opacity={0.25 + 0.75 * phi[i]}>
                <title>{phi[i] === 1 ? `${labels[i]}: 기각` : `${labels[i]}: 확률 ${fmtP(phi[i])}로 기각`}</title>
              </rect>
            ) : null,
          )}

        {/* 관측값 */}
        {observed !== null && observed !== undefined && observed >= lo && observed <= hi && (
          <g>
            <line x1={x(observed)} x2={x(observed)} y1={m.t - 4} y2={H - m.b} stroke="var(--c-obs)" strokeWidth={2} strokeDasharray="5 4" />
            <text x={x(observed) + 5} y={m.t + 6} fontSize={11} fill="var(--c-obs)" fontWeight={600}>
              관측
            </text>
          </g>
        )}

        {/* 클릭·키보드 조작 */}
        {onToggle &&
          idx.map((i) => (
            <g
              key={`h${i}`}
              className="bar-hit"
              role="button"
              tabIndex={0}
              aria-pressed={phi ? phi[i] > 0 : false}
              aria-label={`${labels[i]}: ${phi && phi[i] > 0 ? '기각역에 포함됨' : '기각역에 없음'}. 눌러서 바꾸기`}
              onClick={() => onToggle(i)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  onToggle(i)
                }
              }}
            >
              <rect className="focus-ring" x={x(i) - band / 2 + 1} width={band - 2} y={m.t} height={H - m.b - m.t + 10} fill="transparent" rx={4} />
            </g>
          ))}
      </svg>
    </div>
  )
}
