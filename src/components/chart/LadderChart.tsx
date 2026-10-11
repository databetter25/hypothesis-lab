import { fmtTick, linear, niceTicks } from './scale'

/** 반복 표본의 신뢰구간 사다리: 참값을 덮은 구간은 파랑, 놓친 구간은 빨강 */
export function LadderChart({ intervals, truth, yDomain, ariaLabel }: { intervals: { lo: number; hi: number; covers: boolean }[]; truth: number; yDomain: [number, number]; ariaLabel: string }) {
  const W = 640
  const H = 240
  const m = { l: 46, r: 10, t: 12, b: 34 }
  const N = intervals.length
  const x = linear(0, N + 1, m.l, W - m.r)
  const y = linear(yDomain[0], yDomain[1], H - m.b, m.t)
  const cy = (v: number) => y(Math.min(yDomain[1], Math.max(yDomain[0], v)))
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        <g className="axis">
          {niceTicks(yDomain[0], yDomain[1], 5).map((t) => (
            <g key={t}>
              <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--c-border-lt)" />
              <text x={m.l - 6} y={y(t) + 4} textAnchor="end">
                {fmtTick(t)}
              </text>
            </g>
          ))}
          <text className="axis-title" x={(m.l + W - m.r) / 2} y={H - 8} textAnchor="middle">
            반복 표본 번호 1 ~ {N}
          </text>
        </g>
        {intervals.map((iv, i) => (
          <line key={i} x1={x(i + 1)} x2={x(i + 1)} y1={cy(iv.lo)} y2={cy(iv.hi)} stroke={iv.covers ? 'var(--c-null)' : 'var(--c-reject)'} strokeWidth={iv.covers ? 3 : 4} strokeLinecap="round" />
        ))}
        <line x1={m.l} x2={W - m.r} y1={y(truth)} y2={y(truth)} stroke="var(--c-obs)" strokeWidth={1.5} strokeDasharray="5 4" />
        <text x={W - m.r - 4} y={y(truth) - 5} textAnchor="end" fontSize={11} fontWeight={600} fill="var(--c-obs)">
          참값 θ*
        </text>
      </svg>
    </div>
  )
}
