import { fmtTick, linear, niceTicks } from './scale'

interface Props {
  xDomain: [number, number]
  yDomain: [number, number]
  /** 이산(동전): 관측값 y마다 신뢰구간 [lo, hi] — 이것을 쌓으면 신뢰띠가 된다 */
  bars?: { y: number; lo: number; hi: number }[]
  /** 연속(정규): 가설값 θ₀마다 수용역 [lower(θ₀), upper(θ₀)] */
  band?: { lower: (t: number) => number; upper: (t: number) => number }
  observedY: number
  theta0: number
  /** 관측값 가로선 위의 신뢰구간 */
  ci: [number, number]
  /** θ₀ 세로선 위의 수용역: 동전은 x별 포함 여부, 정규는 구간 */
  accept: boolean[] | [number, number]
  xTitle: string
  yTitle: string
  ariaLabel: string
  height?: number
}

const W = 640

/** Neyman의 신뢰띠: 세로로 자르면 수용역 A(θ₀), 가로로 자르면 신뢰구간 C(x) */
export function BeltChart({ xDomain, yDomain, bars, band, observedY, theta0, ci, accept, xTitle, yTitle, ariaLabel, height = 330 }: Props) {
  const H = height
  const m = { l: 52, r: 14, t: 14, b: 52 }
  const x = linear(xDomain[0], xDomain[1], m.l, W - m.r)
  const y = linear(yDomain[0], yDomain[1], H - m.b, m.t)
  const clipX = (v: number) => Math.min(xDomain[1], Math.max(xDomain[0], v))
  const unit = bars ? Math.abs(y(1) - y(0)) : 0
  const barH = bars ? Math.max(2, Math.min(unit * 0.7, 18)) : 0

  let bandPath = ''
  if (band) {
    const N = 120
    const ts = Array.from({ length: N + 1 }, (_, i) => xDomain[0] + ((xDomain[1] - xDomain[0]) * i) / N)
    const clipY = (v: number) => Math.min(yDomain[1], Math.max(yDomain[0], v))
    bandPath = ts.map((t, i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(clipY(band.upper(t))).toFixed(1)}`).join('') + [...ts].reverse().map((t) => `L${x(t).toFixed(1)},${y(clipY(band.lower(t))).toFixed(1)}`).join('') + 'Z'
  }

  const yTicks = bars ? niceTicks(yDomain[0], yDomain[1], Math.min(10, yDomain[1] - yDomain[0])).filter((v) => Number.isInteger(v)) : niceTicks(yDomain[0], yDomain[1], 6)

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        <g className="axis">
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--c-border-lt)" />
              <text x={m.l - 6} y={y(t) + 4} textAnchor="end">
                {fmtTick(t)}
              </text>
            </g>
          ))}
          <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} />
          {niceTicks(xDomain[0], xDomain[1], 8).map((t) => (
            <text key={`x${t}`} x={x(t)} y={H - m.b + 18} textAnchor="middle">
              {fmtTick(t)}
            </text>
          ))}
          <text className="axis-title" x={(m.l + W - m.r) / 2} y={H - 8} textAnchor="middle">
            {xTitle}
          </text>
          <text className="axis-title" transform={`translate(18 ${(m.t + H - m.b) / 2}) rotate(-90)`} textAnchor="middle">
            {yTitle}
          </text>
        </g>

        {/* 신뢰띠 */}
        {bars?.map((b) => (
          <rect key={b.y} x={x(clipX(b.lo))} width={Math.max(1, x(clipX(b.hi)) - x(clipX(b.lo)))} y={y(b.y) - barH / 2} height={barH} fill="var(--c-null-fill)" stroke="var(--c-null)" strokeWidth={0.6} rx={2} />
        ))}
        {band && <path d={bandPath} fill="var(--c-null-fill)" stroke="var(--c-null)" strokeWidth={1} />}

        {/* θ₀ 세로선과 수용역 */}
        <line x1={x(theta0)} x2={x(theta0)} y1={m.t} y2={H - m.b} stroke="var(--c-alt)" strokeWidth={1.5} strokeDasharray="5 4" />
        {Array.isArray(accept) && typeof accept[0] === 'boolean'
          ? (accept as boolean[]).map((a, k) => (a ? <circle key={`a${k}`} cx={x(theta0)} cy={y(k)} r={Math.max(2.5, Math.min(5, barH / 2))} fill="var(--c-alt)" /> : null))
          : (() => {
              const [lo, hi] = accept as [number, number]
              return <line x1={x(theta0)} x2={x(theta0)} y1={y(Math.min(yDomain[1], hi))} y2={y(Math.max(yDomain[0], lo))} stroke="var(--c-alt)" strokeWidth={6} strokeLinecap="round" opacity={0.75} />
            })()}
        {/* 오른쪽 끝에 가까우면 왼쪽으로 붙여 잘리지 않게 한다 */}
        <text x={x(theta0) > W - 160 ? x(theta0) - 6 : x(theta0) + 6} y={m.t + 10} textAnchor={x(theta0) > W - 160 ? 'end' : 'start'} fontSize={11} fill="var(--c-alt)" fontWeight={600}>
          θ₀의 수용역 A(θ₀)
        </text>

        {/* 관측값 가로선과 신뢰구간 */}
        <line x1={m.l} x2={W - m.r} y1={y(observedY)} y2={y(observedY)} stroke="var(--c-obs)" strokeWidth={1.2} strokeDasharray="5 4" />
        <line x1={x(clipX(ci[0]))} x2={x(clipX(ci[1]))} y1={y(observedY)} y2={y(observedY)} stroke="var(--c-obs)" strokeWidth={5} strokeLinecap="round" />
        <text x={(x(clipX(ci[0])) + x(clipX(ci[1]))) / 2} y={y(observedY) - 8} textAnchor="middle" fontSize={11} fill="var(--c-obs)" fontWeight={600}>
          신뢰구간 C(x)
        </text>
      </svg>
    </div>
  )
}
