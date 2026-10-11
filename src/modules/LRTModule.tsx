import { useMemo } from 'react'
import { coinLogLambda, coinLrtPValue, coinLrtRule, coinPmf, coinPValue, coinWilksSize } from '../engine/coin'
import { expectPhi } from '../engine/discrete'
import { chi2Pdf1, chi2Ppf1Upper, chi2Sf1, normPdf } from '../engine/core/normal'
import { normalAutoRule, stdErr, zStat } from '../engine/normal'
import { DiscreteChart } from '../components/chart/DiscreteChart'
import { ContinuousChart } from '../components/chart/ContinuousChart'
import { Fold, Legend, SliderField, StatGrid, Tex, TextbookBadge } from '../components/ui'
import { SimPanel, SimRate } from '../components/SimPanel'
import { useSimulation } from '../lib/useSimulation'
import { fmtAlpha, fmtNum, fmtP } from '../lib/format'
import type { LabState } from '../state/labState'
import { CommonFields, LabLayout, StatusBar, ensureSeed, verdict, type Update } from './common'

interface Props {
  s: LabState
  update: Update
}

const W_PRESETS = [
  { id: 'W01', n: 10, t0: 0.5 },
  { id: 'W02', n: 20, t0: 0.5 },
  { id: 'W03', n: 50, t0: 0.5 },
  { id: 'W04', n: 20, t0: 0.1 },
  { id: 'W05', n: 200, t0: 0.1 },
]

export function LRTModule({ s, update }: Props) {
  return s.model === 'normal' ? <LRTNormal s={s} update={update} /> : <LRTCoin s={s} update={update} />
}

function LRTExplain() {
  return (
    <>
      <TextbookBadge>교재 정의 7.3 · 정리 7.2 · p.272~279</TextbookBadge>
      <h2 style={{ marginTop: 10 }}>대립가설이 양쪽일 때</h2>
      <p>H₁: θ ≠ θ₀에는 균일최강력검정이 없습니다. 대신 각 가설 아래의 <strong>최대가능도</strong>를 비교합니다.</p>
      <Tex block>{String.raw`\Lambda(\mathbf x)=\frac{f(\mathbf x\mid\hat\theta_0)}{f(\mathbf x\mid\hat\theta)}\ \le 1,\qquad R=\{\Lambda<k'\}`}</Tex>
      <p>
        <strong>Wilks 근사 (정리 7.2)</strong>: 표본이 크면 H₀ 아래 −2 log Λ는 근사적으로 χ²분포를 따릅니다. 자유도는 (전체에서 추정하는 모수 수) − (H₀에서 추정하는 모수 수)입니다.
      </p>
      <p className="muted">가능도비의 방향: 최강력검정은 f₁/f₀ &gt; k (대립/귀무), 가능도비검정은 귀무/전체 &lt; k′입니다.</p>
    </>
  )
}

/* ---------------- 동전 ---------------- */

function LRTCoin({ s, update }: Props) {
  const calc = useMemo(() => {
    const f0 = coinPmf(s.n, s.t0)
    const ll = coinLogLambda(s.n, s.t0)
    const rule = coinLrtRule(s.n, s.t0, s.a)
    const crit = chi2Ppf1Upper(s.a)
    const wilksPhi = Float64Array.from(ll, (l) => (-2 * l > crit ? 1 : 0))
    return { f0, ll, rule, crit, wilksPhi, wilksSize: coinWilksSize(s.n, s.t0, s.a) }
  }, [s.n, s.t0, s.a])
  const x = Math.min(s.x, s.n)
  const pL = coinLrtPValue(s.n, s.t0, x)
  const p2 = coinPValue(s.n, s.t0, x, 'two-tail')
  const pW = chi2Sf1(-2 * calc.ll[x])
  const inR = calc.rule.phi[x] === 1
  const W = Array.from(calc.ll, (l) => -2 * l)

  const simKey = JSON.stringify(['lrt-c', s.n, s.t0, s.a, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    sim.run({ model: 'coin', n: s.n, theta: s.t0, B: s.B, seed, phi: [...calc.wilksPhi] }, JSON.stringify(['lrt-c', s.n, s.t0, s.a, s.B, seed]))
  }
  const simW = useMemo(() => {
    const r = sim.result
    if (!r?.counts) return null
    const out = new Float64Array(r.B)
    let k = 0
    r.counts.forEach((c, xx) => {
      for (let j = 0; j < c; j++) out[k++] = W[xx]
    })
    return out
  }, [sim.result, W])

  return (
    <>
      <StatusBar items={[['모형', `X ~ B(${s.n}, θ)`], ['가설', `H₀: θ = ${s.t0}  대  H₁: θ ≠ ${s.t0}`], ['관측', `x = ${x}, θ̂ = ${fmtNum(x / s.n, 3)}`], ['LRT 규칙 크기', fmtP(calc.rule.size)]]} />
      <LabLayout
        explain={<LRTExplain />}
        chart={
          <>
            <div className="panel chart-panel">
              <DiscreteChart
                labels={Array.from({ length: s.n + 1 }, (_, i) => i)}
                theory={[{ values: calc.f0, color: 'var(--c-null)', label: 'H₀' }]}
                phi={calc.rule.phi}
                pRegion={Array.from(calc.ll, (l) => l <= calc.ll[x] + 1e-9 * Math.max(1, Math.abs(calc.ll[x])))}
                observed={x}
                onToggle={(i) => update({ x: i })}
                ariaLabel={`양측 가능도비검정. 관측 ${x}, LRT p-값 ${fmtP(pL)}`}
                xTitle="x (막대를 눌러 관측값 선택)"
              />
              <Legend items={[{ color: 'var(--c-null)', label: 'H₀ 분포' }, { color: 'var(--c-reject)', label: 'LRT 기각역 (Λ가 작은 값)', pattern: 'hatch' }, { color: 'var(--c-pval)', label: 'Λ(u) ≤ Λ(x)인 영역', pattern: 'dots' }]} />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '자료의 성질', label: 'p-값 (Λ 순서) — 기본 판정', value: fmtP(pL), tone: 'blue' },
                  { tag: '자료의 성질', label: 'p-값 (작은 꼬리 × 2)', value: fmtP(p2), sub: Math.abs(pL - p2) > 1e-9 ? '두 정의가 다릅니다' : 'θ₀ = 0.5이면 같습니다' },
                  { tag: '자료의 성질', label: '−2 log Λ (χ²₁ 근사 p-값)', value: fmtNum(W[x], 3), sub: `근사 p = ${fmtP(pW)}` },
                  { tag: '규칙의 성질', label: 'χ² 기각역의 정확한 크기', value: fmtP(calc.wilksSize), sub: `목표 α = ${fmtAlpha(s.a)}`, tone: 'orange' },
                ]}
              />
            </div>
            <div style={{ marginTop: 12 }}>{verdict(inR)}</div>
            {(s.a <= pL) !== (s.a <= p2) && (
              <p className="note" style={{ marginTop: 12 }}>
                이 관측값에서는 두 양측 p-값의 판정이 갈립니다 (E08). "극단"을 무엇으로 정의하느냐에 따라 결론이 달라질 수 있습니다.
              </p>
            )}
            <div className="panel chart-panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '4px 4px 8px' }}>Wilks 근사: H₀ 아래 −2 log Λ와 χ²₁</h3>
              <ContinuousChart
                domain={[0, Math.max(8, calc.crit + 2)]}
                curves={[{ fn: chi2Pdf1, color: 'var(--c-blue)', fill: 'transparent', label: 'χ²₁ 밀도' }]}
                shades={[{ curve: 0, from: calc.crit, to: Infinity, kind: 'reject' }]}
                vlines={[{ x: calc.crit, label: `χ²₁,α = ${fmtNum(calc.crit, 3)}`, color: 'var(--c-reject)', dashed: false }]}
                hist={simW ? { values: simW, bins: 40 } : null}
                yMaxHint={1.2}
                ariaLabel="−2 log Λ의 시뮬레이션 분포와 카이제곱 1 밀도"
                xTitle="−2 log Λ"
              />
              <p className="field-hint" style={{ margin: '0 4px 8px' }}>
                이산분포라 −2 log Λ는 몇 개의 값에만 몰립니다. χ² 기각역의 정확한 크기 {fmtP(calc.wilksSize)}를 α = {fmtAlpha(s.a)}와 비교해 보세요.
              </p>
            </div>
            <div className="panel" style={{ marginTop: 16 }}>
              <h3>값별 가능도비</h3>
              <div className="table-scroll" tabIndex={0} role="region" aria-label="표 (넘치면 가로·세로로 스크롤)">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>x</th>
                      <th>θ̂ = x/n</th>
                      <th>log Λ</th>
                      <th>−2 log Λ</th>
                      <th>f₀(x)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: s.n + 1 }, (_, i) => (
                      <tr key={i} className={calc.rule.phi[i] === 1 ? 'in-r' : undefined}>
                        <td>{i === x ? <strong>{i} (관측)</strong> : i}</td>
                        <td>{fmtNum(i / s.n, 3)}</td>
                        <td>{fmtNum(calc.ll[i], 4)}</td>
                        <td>{fmtNum(W[i], 4)}</td>
                        <td>{fmtP(calc.f0[i])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="math-panels panel">
              <Fold title="이항 양측 가능도비" open>
                <Tex block>{String.raw`\log\Lambda(x)=x\log\frac{\theta_0}{\hat\theta}+(n-x)\log\frac{1-\theta_0}{1-\hat\theta},\quad \hat\theta=\frac{x}{n},\quad 0\log 0=0`}</Tex>
                <Tex block>{String.raw`p_\Lambda(x)=\sum_{u:\,\Lambda(u)\le\Lambda(x)}f(u\mid\theta_0)`}</Tex>
                <p>
                  LRT 규칙의 정확한 크기 = {fmtP(expectPhi(calc.rule.phi, calc.f0))}. 가능도비 기준은 Neyman–Pearson(1928)이 먼저 제안했고, Wilks(1938)가 −2 log Λ의 점근 χ²분포를 보였습니다.
                </p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: true, t0: true, a: true }} />
              <div style={{ marginTop: 16 }}>
                <SliderField label="관측값 x" value={x} min={0} max={s.n} step={1} onChange={(v) => update({ x: v })} />
              </div>
              <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => update({ n: 20, t0: 0.2, a: 0.05, x: 8 })}>
                E08 불러오기 (θ₀=0.2, x=8)
              </button>
            </div>
            <div className="panel">
              <h3>Wilks 근사 점검 (W 시리즈)</h3>
              <div className="row">
                {W_PRESETS.map((w) => (
                  <button key={w.id} className="btn-outline sm" onClick={() => update({ n: w.n, t0: w.t0, a: 0.05, x: Math.round(w.n * w.t0) })} aria-pressed={s.n === w.n && s.t0 === w.t0}>
                    {w.id}: n={w.n}, θ₀={w.t0}
                  </button>
                ))}
              </div>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label="H₀ 아래 −2 log Λ 반복 계산">
              {sim.result && <SimRate label="χ² 기각역에 든 비율" k={sim.result.rejects} B={sim.result.B} exact={calc.wilksSize} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

/* ---------------- 정규 ---------------- */

function LRTNormal({ s, update }: Props) {
  const se = stdErr(s.sd, s.n)
  const z = zStat(s.x, s.t0, s.sd, s.n)
  const W = z * z
  const crit = chi2Ppf1Upper(s.a)
  const rule = normalAutoRule(s.t0, s.sd, s.n, s.a, 'two')
  const simKey = JSON.stringify(['lrt-n', s.n, s.t0, s.sd, s.a, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    sim.run({ model: 'normal', n: s.n, theta: s.t0, sigma: s.sd, B: s.B, seed, rule }, JSON.stringify(['lrt-n', s.n, s.t0, s.sd, s.a, s.B, seed]))
  }
  const simW = useMemo(() => (sim.result?.values ? Float64Array.from(sim.result.values, (xb) => zStat(xb, s.t0, s.sd, s.n) ** 2) : null), [sim.result, s.t0, s.sd, s.n])
  const lo = s.t0 - 4.5 * se
  const hi = s.t0 + 4.5 * se

  return (
    <>
      <StatusBar items={[['모형', `X̄ ~ N(θ, ${s.sd}²/${s.n})`], ['가설', `H₀: θ = ${s.t0}  대  H₁: θ ≠ ${s.t0}`], ['관측', `x̄ = ${fmtNum(s.x)}, z = ${fmtNum(z)}`]]} />
      <LabLayout
        explain={<LRTExplain />}
        chart={
          <>
            <div className="panel chart-panel">
              <ContinuousChart
                domain={[lo, hi]}
                curves={[{ fn: (x) => normPdf((x - s.t0) / se) / se, color: 'var(--c-null)', fill: 'var(--c-null-fill)', label: 'H₀' }]}
                shades={[
                  { curve: 0, from: rule.upper!, to: Infinity, kind: 'reject' },
                  { curve: 0, from: -Infinity, to: rule.lower!, kind: 'reject' },
                ]}
                vlines={[{ x: s.x, label: '관측 x̄' }]}
                ariaLabel="정규 양측 가능도비검정"
                xTitle="x̄"
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '자료의 성질', label: 'Λ = exp(−z²/2)', value: fmtP(Math.exp(-W / 2)) },
                  { tag: '자료의 성질', label: '−2 log Λ = z²', value: fmtNum(W, 3), sub: `p = ${fmtP(chi2Sf1(W))}` },
                  { tag: '규칙의 성질', label: 'χ²₁ 기각역의 크기', value: fmtP(s.a), sub: '정규에서는 정확히 α', tone: 'blue' },
                  { tag: '임계값', label: '|z| ≥ z_{α/2}', value: fmtNum(Math.sqrt(crit), 3) },
                ]}
              />
            </div>
            <div style={{ marginTop: 12 }}>{verdict(W >= crit)}</div>
            <div className="panel chart-panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '4px 4px 8px' }}>H₀ 아래 −2 log Λ의 분포 = χ²₁ (정확)</h3>
              <ContinuousChart domain={[0, 10]} curves={[{ fn: chi2Pdf1, color: 'var(--c-blue)', fill: 'transparent', label: 'χ²₁' }]} shades={[{ curve: 0, from: crit, to: Infinity, kind: 'reject' }]} hist={simW ? { values: simW, bins: 50 } : null} yMaxHint={1.2} ariaLabel="정규 −2 log Λ 분포" xTitle="−2 log Λ" />
            </div>
            <div className="math-panels panel">
              <Fold title="풀이 (교재 예 7.6, 연습문제 07)" open>
                <Tex block>{String.raw`\Lambda=\frac{f(\mathbf x\mid\theta_0)}{f(\mathbf x\mid\bar x)}=\exp\!\left\{-\frac{n(\bar x-\theta_0)^2}{2\sigma^2}\right\},\qquad -2\log\Lambda=\frac{n(\bar X-\theta_0)^2}{\sigma^2}=Z^2\sim\chi^2_1`}</Tex>
                <p>Λ는 |x̄ − θ₀|의 감소함수이므로 기각역은 |Z| ≥ z_{'{α/2}'}입니다.</p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: true, t0: true, sd: true, a: true }} />
              <div style={{ marginTop: 16 }}>
                <SliderField label="관측 x̄" value={s.x} min={Number((s.t0 - 5 * se).toFixed(2))} max={Number((s.t0 + 5 * se).toFixed(2))} step={0.01} onChange={(v) => update({ x: v })} />
              </div>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label="H₀ 아래 반복 (교재 프로그램 7.1)">
              {sim.result && <SimRate label="|z| ≥ z_{α/2} 비율" k={sim.result.rejects} B={sim.result.B} exact={s.a} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}
