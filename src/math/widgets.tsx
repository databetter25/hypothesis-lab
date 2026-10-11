import { useMemo, useState } from 'react'
import { coinLogLambda, coinLogRatio, coinLrtRule, coinPmf, coinPowerCurve, coinWilksSize } from '../engine/coin'
import { npRandomized } from '../engine/discrete'
import { chi2Ppf1Upper } from '../engine/core/normal'
import { xlogy } from '../engine/core/stats'
import { LineChart } from '../components/chart/LineChart'
import { Legend, SliderField } from '../components/ui'
import { fmtNum, fmtP } from '../lib/format'
import type { ReactNode } from 'react'

/** 한 줄 요약 → 단계별 펼치기 (PRD F08) */
export function Proof({ title = '증명', summary, steps }: { title?: string; summary: ReactNode; steps: ReactNode[] }) {
  const [shown, setShown] = useState(0)
  return (
    <div className="proof">
      <div className="proof-head">
        <span className="badge badge-blue">{title}</span>
        <span className="proof-summary">{summary}</span>
      </div>
      {shown > 0 && (
        <ol className="proof-steps">
          {steps.slice(0, shown).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
      <div className="row" style={{ marginTop: 10 }}>
        {shown < steps.length ? (
          <>
            <button className="btn-outline sm" onClick={() => setShown(shown + 1)}>
              {shown === 0 ? '단계별로 펼치기' : `다음 단계 (${shown + 1}/${steps.length})`}
            </button>
            <button className="btn-ghost" onClick={() => setShown(steps.length)}>
              모두 보기
            </button>
          </>
        ) : (
          <>
            <span className="field-hint">∎ 증명 끝</span>
            <button className="btn-ghost" onClick={() => setShown(0)}>
              접기
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const grid = (a: number, b: number, k = 200) => Array.from({ length: k + 1 }, (_, i) => a + ((b - a) * i) / k)

/** §1 가능도: 자료를 고정하고 모수를 움직인다 */
export function LikelihoodWidget() {
  const [n, setN] = useState(20)
  const [x, setX] = useState(14)
  const xx = Math.min(x, n)
  const hat = xx / n
  const pts = useMemo(() => {
    const lmax = xlogy(xx, hat) + xlogy(n - xx, 1 - hat)
    return grid(0, 1).map((t) => [t, Math.exp(xlogy(xx, t) + xlogy(n - xx, 1 - t) - lmax)] as [number, number])
  }, [n, xx, hat])
  return (
    <div className="widget">
      <div className="widget-grid">
        <div className="panel chart-panel">
          <LineChart
            xDomain={[0, 1]}
            yDomain={[0, 1.05]}
            series={[{ pts, color: 'var(--c-blue)', label: '상대가능도' }]}
            markers={[{ x: hat, y: 1, color: 'var(--c-alt)', label: `θ̂ = ${fmtNum(hat, 3)}` }]}
            xTitle="모수 θ (움직이는 쪽)"
            yTitle="L(θ) / L(θ̂)"
            ariaLabel={`앞면 ${xx}회, n=${n}일 때 상대가능도 곡선. 최대가능도추정값 ${fmtNum(hat, 3)}`}
          />
        </div>
        <div className="settings">
          <SliderField label="표본크기 n" value={n} min={1} max={100} step={1} onChange={(v) => setN(v)} />
          <SliderField label="관측 앞면 수 x (고정된 자료)" value={xx} min={0} max={n} step={1} onChange={(v) => setX(v)} />
          <p className="field-hint">곡선의 가로축은 자료가 아니라 모수입니다. n을 키우면 곡선이 θ̂ 주위로 좁아집니다.</p>
        </div>
      </div>
    </div>
  )
}

/** §6 단조가능도비: θ₁ > θ₀이면 log(f₁/f₀)가 x의 증가함수 */
export function MLRWidget() {
  const n = 20
  const th = [
    { t: 0.55, color: '#34aadc' },
    { t: 0.7, color: 'var(--c-blue)' },
    { t: 0.9, color: '#1a7f37' },
    { t: 0.3, color: 'var(--c-alt)' },
  ]
  const series = th.map(({ t, color }) => ({ pts: Array.from(coinLogRatio(n, 0.5, t), (v, x) => [x, v] as [number, number]), color, label: `θ₁ = ${t}`, dashed: t < 0.5 }))
  let lo = 0
  let hi = 0
  for (const s of series)
    for (const [, v] of s.pts) {
      lo = Math.min(lo, v)
      hi = Math.max(hi, v)
    }
  return (
    <div className="widget">
      <div className="panel chart-panel">
        <LineChart xDomain={[0, n]} yDomain={[Math.floor(lo), Math.ceil(hi)]} series={series} hlines={[{ y: 0, label: '' }]} xTitle="앞면 수 x (n = 20, θ₀ = 0.5)" yTitle="log f(x|θ₁)/f(x|θ₀)" ariaLabel="θ₁별 로그 가능도비. θ₁이 0.5보다 크면 증가, 작으면 감소" />
        <Legend items={series.map((s) => ({ color: s.color, label: s.label + (s.dashed ? ' (θ₁ < θ₀: 감소)' : ''), pattern: s.dashed ? ('line' as const) : undefined }))} />
      </div>
    </div>
  )
}

/** §7 UMP가 없다: 우측·좌측 최강력 검정과 양측 LRT의 검정력 곡선 */
export function NoUMPWidget() {
  const n = 20
  const a = 0.05
  const g = grid(0, 1)
  // 단측은 크기를 정확히 α에 맞춘 확률화 최강력검정 (비확률화 규칙은 크기가 0.0207에 그쳐 비교가 왜곡된다)
  const f0 = coinPmf(n, 0.5)
  const R = npRandomized(f0, coinPmf(n, 0.7), a, coinLogRatio(n, 0.5, 0.7)).phi
  const L = npRandomized(f0, coinPmf(n, 0.3), a, coinLogRatio(n, 0.5, 0.3)).phi
  const lrt = coinLrtRule(n, 0.5, a)
  const T = lrt.phi
  const mk = (phi: Float64Array) => {
    const v = coinPowerCurve(phi, n, g)
    return g.map((t, i) => [t, v[i]] as [number, number])
  }
  const pR7 = coinPowerCurve(R, n, [0.7])[0]
  const pT7 = coinPowerCurve(T, n, [0.7])[0]
  const series = [
    { pts: mk(R), color: 'var(--c-blue)', label: '우측 최강력 (확률화, 크기 0.05)' },
    { pts: mk(L), color: 'var(--c-alt)', label: '좌측 최강력 (확률화, 크기 0.05)' },
    { pts: mk(T), color: 'var(--c-text-primary)', label: `양측 LRT (크기 ${fmtP(lrt.size)})`, dashed: true },
  ]
  return (
    <div className="widget">
      <div className="panel chart-panel">
        <LineChart xDomain={[0, 1]} series={series} vlines={[{ x: 0.5, label: 'θ₀' }]} hlines={[{ y: a, label: 'α = 0.05' }]} xTitle="실제 θ (n = 20)" yTitle="검정력 π(θ)" ariaLabel="우측, 좌측 검정과 양측 가능도비검정의 검정력 곡선" />
        <Legend items={series.map((s) => ({ color: s.color, label: s.label, pattern: s.dashed ? ('line' as const) : undefined }))} />
      </div>
      <p className="field-hint">
        θ = 0.7에서 파랑은 {fmtP(pR7)}, 양측 LRT는 {fmtP(pT7)}입니다. 그러나 파랑은 θ &lt; 0.5에서 거의 0입니다. 주황은 그 반대입니다. 양쪽 모두에서 가장 높은 곡선은 없습니다. 양측 LRT(점선)는 어느 쪽에서도 최고는 아니지만 양쪽 모두에서 쓸 만한 타협입니다.
      </p>
    </div>
  )
}

/** §8–9 이항 −2 log Λ와 χ²₁ 임계값 */
export function LambdaWidget() {
  const [n, setN] = useState(20)
  const [t0, setT0] = useState(0.5)
  const crit = chi2Ppf1Upper(0.05)
  const ll = coinLogLambda(n, t0)
  const pts = Array.from(ll, (l, x) => [x, -2 * l] as [number, number])
  const yMax = Math.max(crit * 1.6, ...pts.map((p) => Math.min(p[1], 30)))
  const size = coinWilksSize(n, t0, 0.05)
  return (
    <div className="widget">
      <div className="widget-grid">
        <div className="panel chart-panel">
          <LineChart
            xDomain={[0, n]}
            yDomain={[0, Math.ceil(yMax)]}
            series={[{ pts: pts.map(([x, y]) => [x, Math.min(y, Math.ceil(yMax))]), color: 'var(--c-blue)', label: '−2 log Λ(x)' }]}
            markers={[{ x: n * t0, y: 0, color: 'var(--c-null)', label: 'nθ₀' }]}
            hlines={[{ y: crit, label: `χ²₁,0.05 = ${fmtNum(crit, 3)}`, color: 'var(--c-reject)' }]}
            xTitle="x"
            yTitle="−2 log Λ"
            ariaLabel={`n=${n}, θ₀=${t0}에서 −2 log Λ. χ² 기각역의 정확한 크기 ${fmtP(size)}`}
          />
        </div>
        <div className="settings">
          <SliderField label="n" value={n} min={2} max={200} step={1} onChange={setN} />
          <SliderField label="θ₀" value={t0} min={0.05} max={0.95} step={0.05} onChange={setT0} />
          <div className="stats-row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="stat-box">
              <div className="stat-tag">χ² 기각역의 정확한 크기</div>
              <div className={`stat-num ${Math.abs(size - 0.05) > 0.015 ? 'orange' : 'blue'}`}>{fmtP(size)}</div>
              <div className="stat-sub">목표 α = 0.05</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
