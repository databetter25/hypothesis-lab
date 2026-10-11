import { useMemo, useState } from 'react'
import { nvarDensity, nvarMP, nvarPower, nvarPValue, poisMP, poisPValue, poisTable } from '../engine/more'
import { DiscreteChart } from '../components/chart/DiscreteChart'
import { ContinuousChart } from '../components/chart/ContinuousChart'
import { LineChart } from '../components/chart/LineChart'
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

export function MoreModule({ s, update }: Props) {
  return s.model === 'nvar' ? <NVar s={s} update={update} /> : <Pois s={s} update={update} />
}

/* ---------------- 포아송 평균 (교재 예 7.3) ---------------- */

function Pois({ s, update }: Props) {
  const [rand, setRand] = useState(false)
  const mp = useMemo(() => poisMP(s.n, s.t0, s.t1, s.a), [s.n, s.t0, s.t1, s.a])
  const phi = rand ? mp.np.phi : mp.phi
  const t = Math.round(s.x)
  const p = poisPValue(t, s.n, s.t0, mp.side)
  const reject = t <= mp.tMax ? phi[t] === 1 : mp.side === 'R'
  const ruleText = mp.side === 'L' ? (mp.c < 0 ? 'R = ∅' : `R = {T ≤ ${mp.c}}`) : mp.c > mp.tMax ? 'R = ∅' : `R = {T ≥ ${mp.c}}`

  // 검정력함수 (θ에 따라)
  const thetaMax = Math.max(s.t0, s.t1) * 2.5
  const curve = useMemo(() => {
    const out: [number, number][] = []
    for (let i = 1; i <= 120; i++) {
      const th = (thetaMax * i) / 120
      const f = poisTable(s.n * th, mp.tMax)
      let pw = 0
      for (let k = 0; k <= mp.tMax; k++) pw += phi[k] * f[k]
      out.push([th, pw])
    }
    return out
  }, [thetaMax, s.n, mp.tMax, phi])
  const powerTs = useMemo(() => {
    const f = poisTable(s.n * s.ts, mp.tMax)
    let pw = 0
    for (let k = 0; k <= mp.tMax; k++) pw += phi[k] * f[k]
    return pw
  }, [s.n, s.ts, mp.tMax, phi])

  const simKey = JSON.stringify(['pois', s.n, s.t0, s.t1, s.ts, s.a, rand, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    sim.run({ model: 'table', probs: [...poisTable(s.n * s.ts, mp.tMax)], B: s.B, seed, phi: [...phi] }, JSON.stringify(['pois', s.n, s.t0, s.t1, s.ts, s.a, rand, s.B, seed]))
  }
  const labels = Array.from({ length: mp.tMax + 1 }, (_, k) => (k === mp.tMax ? `${k}+` : k))

  return (
    <>
      <StatusBar
        items={[
          ['모형', `X₁…X${'ₙ'} ~ Poisson(θ), n = ${s.n}, T = ΣXᵢ ~ Poisson(nθ)`],
          ['가설', `H₀: θ = ${s.t0}  대  H₁: θ = ${s.t1}`],
          ['규칙', rand ? `${ruleText} + 경계 T = ${mp.np.boundary.join(', ')}에서 γ` : ruleText],
        ]}
      />
      <LabLayout
        explain={
          <>
            <TextbookBadge>교재 예 7.3 · p.267</TextbookBadge>
            <h2 style={{ marginTop: 10 }}>포아송 평균의 최강력검정</h2>
            <p>가능도비는 ΣXᵢ에만 의존합니다. θ₁ &lt; θ₀이면 ΣXᵢ의 감소함수이므로 기각역은 ΣXᵢ ≤ c 꼴입니다.</p>
            <Tex block>{String.raw`\frac{f(\mathbf x\mid\theta_1)}{f(\mathbf x\mid\theta_0)}=\left(\frac{\theta_1}{\theta_0}\right)^{\sum x_i}e^{-n(\theta_1-\theta_0)}`}</Tex>
            <p>
              교재는 n = 10, θ₀ = 0.3, θ₁ = 0.1에서 α = 4e⁻³ ≈ 0.199로 잡아 R = {'{ΣXᵢ ≤ 1}'}이 크기를 정확히 맞추게 했습니다. α = 0.05처럼 정확히 맞지 않는 값을 넣으면 이산분포의 문제가 다시 나타나고, 확률화로 해결합니다(교재 7.6).
            </p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <div className="tab-nav" style={{ margin: '4px 4px 10px' }}>
                <button className={`tab-btn${!rand ? ' active' : ''}`} onClick={() => setRand(false)}>
                  비확률화
                </button>
                <button className={`tab-btn${rand ? ' active' : ''}`} onClick={() => setRand(true)}>
                  확률화 (크기 = α)
                </button>
              </div>
              <DiscreteChart
                labels={labels}
                theory={[
                  { values: mp.f0, color: 'var(--c-null)', label: 'H₀' },
                  { values: mp.f1, color: 'var(--c-alt)', label: 'H₁' },
                ]}
                phi={phi}
                observed={Math.min(t, mp.tMax)}
                onToggle={(i) => update({ x: i })}
                sim={sim.result?.counts ? sim.result.counts.map((c) => c / sim.result!.B) : null}
                ariaLabel={`T의 분포. ${ruleText}`}
                xTitle="T = ΣXᵢ (막대를 눌러 관측값 선택)"
              />
              <Legend items={[{ color: 'var(--c-null)', label: `H₀: Poisson(${fmtNum(s.n * s.t0, 2)})` }, { color: 'var(--c-alt)', label: `H₁: Poisson(${fmtNum(s.n * s.t1, 2)})` }, { color: 'var(--c-reject)', label: '기각 (진할수록 φ가 큼)', pattern: 'hatch' }]} />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '규칙의 성질', label: '크기', value: fmtP(rand ? mp.np.size : mp.size), sub: `목표 α = ${fmtAlpha(s.a)}`, tone: 'blue' },
                  { tag: `θ₁ = ${s.t1}에서`, label: '검정력', value: fmtP(rand ? mp.npPower : mp.power), sub: rand ? `비확률화: ${fmtP(mp.power)}` : `확률화: ${fmtP(mp.npPower)}`, tone: 'orange' },
                  { tag: '자료의 성질', label: `관측 T = ${t}의 p-값`, value: fmtP(p), sub: mp.side === 'L' ? 'P(T ≤ t | H₀)' : 'P(T ≥ t | H₀)' },
                  { tag: '확률화', label: '경계에서 γ', value: mp.np.boundary.length ? fmtNum(mp.np.gamma, 6) : '—', sub: mp.np.boundary.length ? `T = ${mp.np.boundary.join(', ')}` : '정확히 맞음' },
                ]}
              />
            </div>
            <div style={{ marginTop: 12 }}>{verdict(reject)}</div>
            <div className="panel chart-panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '4px 4px 8px' }}>검정력함수 π(θ)</h3>
              <LineChart
                xDomain={[0, thetaMax]}
                series={[{ pts: curve, color: 'var(--c-blue)', label: 'π(θ)' }]}
                markers={[
                  { x: s.t0, y: rand ? mp.np.size : mp.size, color: 'var(--c-null)', label: '크기' },
                  { x: s.t1, y: rand ? mp.npPower : mp.power, color: 'var(--c-alt)', label: '검정력' },
                ]}
                hlines={[{ y: s.a, label: `α = ${fmtAlpha(s.a)}` }]}
                xTitle="θ"
                yTitle="기각 확률"
                ariaLabel="포아송 검정의 검정력함수"
              />
              <p className="field-hint" style={{ margin: '0 4px 8px' }}>
                θ₁을 θ₀ 쪽에서 움직여도 기각역이 그대로입니다. 단조가능도비 덕분에 이 검정은 H₁: θ {mp.side === 'L' ? '<' : '>'} θ₀에 대한 균일최강력검정입니다.
              </p>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <div className="settings">
                <SliderField label="표본크기 n" value={s.n} min={1} max={100} step={1} onChange={(v) => update({ n: v })} />
                <SliderField label="귀무값 θ₀" value={s.t0} min={0.05} max={10} step={0.05} onChange={(v) => update({ t0: v })} />
                <SliderField label="대립값 θ₁" value={s.t1} min={0.05} max={10} step={0.05} onChange={(v) => (Math.abs(v - s.t0) > 1e-9 ? update({ t1: v }) : undefined)} />
                <SliderField label="관측 합계 T" value={t} min={0} max={mp.tMax} step={1} onChange={(v) => update({ x: v })} />
              </div>
              <div style={{ marginTop: 16 }}>
                <CommonFields s={s} update={update} show={{ a: true }} />
              </div>
              <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => update({ n: 10, t0: 0.3, t1: 0.1, a: 0.19915, x: 1 })}>
                교재 예 7.3 (α ≈ 4e⁻³ = 0.1991)
              </button>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label="반복 실험">
              <div style={{ marginTop: 12 }}>
                <SliderField label="참값 θ*" value={s.ts} min={0.05} max={10} step={0.05} onChange={(v) => update({ ts: v })} />
              </div>
              {sim.result && <SimRate label="기각 비율" k={sim.result.rejects} B={sim.result.B} exact={powerTs} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

/* ---------------- 정규 분산 (교재 예 7.5) ---------------- */

const MU = 1

function NVar({ s, update }: Props) {
  const rule = nvarMP(s.n, s.t0, s.t1, s.a)
  const W = s.x / (s.t0 * s.t0)
  const p = nvarPValue(W, s.n, rule.side)
  const reject = rule.side === 'R' ? W >= rule.c : W <= rule.c
  const wMax = Math.max(rule.c * 2, W * 1.2, (s.n * s.t1 * s.t1) / (s.t0 * s.t0) * 2.5, s.n * 3)
  const sMax = Math.max(s.t0, s.t1) * 2.5
  const curve = useMemo(() => Array.from({ length: 121 }, (_, i) => {
    const sg = (sMax * (i + 1)) / 121
    return [sg, nvarPower(rule, s.t0, sg, s.n)] as [number, number]
  }), [sMax, rule, s.t0, s.n])
  const powerTs = nvarPower(rule, s.t0, s.ts, s.n)

  const simKey = JSON.stringify(['nvar', s.n, s.t0, s.t1, s.ts, s.a, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    sim.run(
      { model: 'nvar', n: s.n, mu: MU, sigma: s.ts, sigma0: s.t0, B: s.B, seed, ...(rule.side === 'R' ? { upper: rule.c } : { lower: rule.c }) },
      JSON.stringify(['nvar', s.n, s.t0, s.t1, s.ts, s.a, s.B, seed]),
    )
  }

  return (
    <>
      <StatusBar
        items={[
          ['모형', `X₁…X${'ₙ'} ~ N(1, σ²), μ = 1 기지, n = ${s.n}`],
          ['가설', `H₀: σ² = ${fmtNum(s.t0 ** 2, 3)}  대  H₁: σ² = ${fmtNum(s.t1 ** 2, 3)}`],
          ['규칙', `W = Σ(Xᵢ−1)²/σ₀² ${rule.side === 'R' ? '≥' : '≤'} ${fmtNum(rule.c, 3)}`],
        ]}
      />
      <LabLayout
        explain={
          <>
            <TextbookBadge>교재 예 7.5 · p.269~270</TextbookBadge>
            <h2 style={{ marginTop: 10 }}>정규 분산의 최강력검정</h2>
            <p>평균을 알 때(μ = 1) 가능도비는 Σ(xᵢ − 1)²의 함수입니다. σ₁² &gt; σ₀²이면 증가함수이므로 큰 값에서 기각합니다.</p>
            <Tex block>{String.raw`\frac{1}{\sigma_0^2}\sum_{i=1}^{n}(X_i-1)^2>\chi^2_\alpha(n)`}</Tex>
            <p>H₀ 아래 W는 χ²(n), σ가 참이면 (σ²/σ₀²)·χ²(n)을 따릅니다. 평균을 추정하지 않으므로 자유도는 n − 1이 아니라 n입니다.</p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <ContinuousChart
                domain={[0, wMax]}
                curves={[
                  { fn: (w) => nvarDensity(w, s.n, s.t0, s.t0), color: 'var(--c-null)', fill: 'var(--c-null-fill)', label: 'H₀' },
                  { fn: (w) => nvarDensity(w, s.n, s.t0, s.t1), color: 'var(--c-alt)', fill: 'var(--c-alt-fill)', label: 'H₁' },
                ]}
                shades={[rule.side === 'R' ? { curve: 0, from: rule.c, to: Infinity, kind: 'reject' } : { curve: 0, from: 0, to: rule.c, kind: 'reject' }]}
                vlines={[
                  { x: W, label: `관측 W = ${fmtNum(W, 2)}` },
                  { x: rule.c, label: `임계값 ${fmtNum(rule.c, 2)}`, color: 'var(--c-reject)', dashed: false },
                ]}
                hist={sim.result?.values ? { values: sim.result.values, bins: 50 } : null}
                ariaLabel={`W의 분포. 임계값 ${fmtNum(rule.c, 3)}`}
                xTitle="W = Σ(xᵢ − 1)²/σ₀²"
              />
              <Legend items={[{ color: 'var(--c-null)', label: `H₀: χ²(${s.n})` }, { color: 'var(--c-alt)', label: `H₁: (σ₁²/σ₀²)·χ²(${s.n})` }, { color: 'var(--c-reject)', label: '기각역 (크기 α)', pattern: 'hatch' }]} />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '규칙의 성질', label: '크기 (연속형이라 정확히 α)', value: fmtP(rule.size), tone: 'blue' },
                  { tag: `σ₁² = ${fmtNum(s.t1 ** 2, 3)}에서`, label: '검정력', value: fmtP(rule.power), tone: 'orange' },
                  { tag: '자료의 성질', label: `관측 Σ(xᵢ−1)² = ${fmtNum(s.x, 3)}`, value: `W = ${fmtNum(W, 3)}`, sub: `p = ${fmtP(p)}` },
                  { tag: '임계값', label: rule.side === 'R' ? 'χ²_α(n)' : 'χ²_{1−α}(n)', value: fmtNum(rule.c, 4) },
                ]}
              />
            </div>
            <div style={{ marginTop: 12 }}>{verdict(reject)}</div>
            <div className="panel chart-panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '4px 4px 8px' }}>검정력함수 π(σ)</h3>
              <LineChart
                xDomain={[0, sMax]}
                series={[{ pts: curve, color: 'var(--c-blue)', label: 'π(σ)' }]}
                markers={[
                  { x: s.t0, y: s.a, color: 'var(--c-null)', label: 'σ₀' },
                  { x: s.t1, y: rule.power, color: 'var(--c-alt)', label: 'σ₁' },
                ]}
                hlines={[{ y: s.a, label: `α = ${fmtAlpha(s.a)}` }]}
                xTitle="σ"
                yTitle="기각 확률"
                ariaLabel="정규 분산 검정의 검정력함수"
              />
            </div>
            <div className="math-panels panel">
              <Fold title="풀이 (교재 예 7.5)" open>
                <Tex block>{String.raw`\frac{f(\mathbf x\mid\sigma_1^2)}{f(\mathbf x\mid\sigma_0^2)}=\left(\frac{\sigma_0^2}{\sigma_1^2}\right)^{n/2}\exp\!\left[\left(\frac{1}{2\sigma_0^2}-\frac{1}{2\sigma_1^2}\right)\sum(x_i-1)^2\right]`}</Tex>
                <p>σ₁² &gt; σ₀²이면 지수 안의 계수가 양수이므로 Σ(xᵢ − 1)²의 증가함수입니다.</p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <div className="settings">
                <SliderField label="표본크기 n" value={s.n} min={1} max={100} step={1} onChange={(v) => update({ n: v })} />
                <SliderField label="귀무 표준편차 σ₀" value={s.t0} min={0.1} max={5} step={0.05} onChange={(v) => update({ t0: v })} />
                <SliderField label="대립 표준편차 σ₁" value={s.t1} min={0.1} max={5} step={0.05} onChange={(v) => (Math.abs(v - s.t0) > 1e-9 ? update({ t1: v }) : undefined)} hint="σ₁ < σ₀로 바꾸면 왼쪽 꼬리 검정" />
                <SliderField label="관측 Σ(xᵢ − 1)²" value={s.x} min={0} max={Math.ceil(wMax * s.t0 * s.t0)} step={0.1} onChange={(v) => update({ x: v })} />
              </div>
              <div style={{ marginTop: 16 }}>
                <CommonFields s={s} update={update} show={{ a: true }} />
              </div>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label="반복 실험">
              <div style={{ marginTop: 12 }}>
                <SliderField label="참 표준편차 σ*" value={s.ts} min={0.1} max={5} step={0.05} onChange={(v) => update({ ts: v })} />
              </div>
              {sim.result && <SimRate label="기각 비율" k={sim.result.rejects} B={sim.result.B} exact={powerTs} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}
