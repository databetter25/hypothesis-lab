import { useMemo, useState } from 'react'
import { chi2Sf1, normPdf, normPpf } from '../engine/core/normal'
import { oneSampleT, parseData, tPdf, tRule, tSf, twoSampleT, type TRule } from '../engine/tdist'
import { ContinuousChart, type Shade } from '../components/chart/ContinuousChart'
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

const fmtB = (v: number) => (v === Infinity ? '∞' : v === -Infinity ? '−∞' : fmtNum(v, 4))
const inRule = (r: TRule, t: number) => (r.upper !== undefined && t >= r.upper) || (r.lower !== undefined && t <= r.lower)

function ruleShades(r: TRule, curve: number): Shade[] {
  return [
    ...(r.upper !== undefined ? [{ curve, from: r.upper, to: Infinity, kind: 'reject' as const }] : []),
    ...(r.lower !== undefined ? [{ curve, from: -Infinity, to: r.lower, kind: 'reject' as const }] : []),
  ]
}

function zRule(alpha: number, dir: LabState['dir']): TRule {
  if (dir === 'two') {
    const z = normPpf(1 - alpha / 2)
    return { upper: z, lower: -z }
  }
  const z = normPpf(1 - alpha)
  return dir === 'R' ? { upper: z } : { lower: -z }
}

/** H₀ 아래 t(ν)를 z 임계값으로 판정할 때의 실제 크기 */
function zRuleSize(alpha: number, v: number, dir: LabState['dir']): number {
  if (dir === 'two') return 2 * tSf(normPpf(1 - alpha / 2), v)
  return tSf(normPpf(1 - alpha), v)
}

export function TModule({ s, update }: Props) {
  return s.model === 't2' ? <TwoSample s={s} update={update} /> : <OneSample s={s} update={update} />
}

function DataPaste({ label, onApply }: { label: string; onApply: (n: number, mean: number, sd: number) => void }) {
  const [text, setText] = useState('')
  const r = text.trim() ? parseData(text) : null
  return (
    <div className="field" style={{ marginTop: 12 }}>
      <span className="field-label">{label}</span>
      <textarea className="text-input" rows={2} placeholder="예: 4.1 5.3 4.8 6.0 5.2" value={text} onChange={(e) => setText(e.target.value)} aria-label={label} />
      {r && !r.ok && <span className="error-text">{r.error}</span>}
      {r && r.ok && (
        <div className="row">
          <span className="field-hint">
            n = {r.values.length}, 평균 {fmtNum(r.mean, 4)}, 표준편차 {fmtNum(r.sd, 4)}
          </span>
          <button className="btn-outline sm" onClick={() => onApply(r.values.length, Number(r.mean.toFixed(6)), Number(r.sd.toFixed(6)))} disabled={r.values.length > 200}>
            요약값에 넣기
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------- 한 표본 t (예 7.7, 프로그램 7.2) ---------------- */

function OneSample({ s, update }: Props) {
  const r = oneSampleT(s.x, s.sd, s.n, s.t0, s.a, s.dir)
  const zr = zRule(s.a, s.dir)
  const reject = inRule(r.rule, r.t)
  const span = Math.max(4.5, Math.abs(r.t) + 1)
  const sizeZ = zRuleSize(s.a, r.df, s.dir)
  const atNull = s.ts === s.t0

  const simKey = JSON.stringify(['t1', s.n, s.ts, s.sig, s.t0, s.a, s.dir, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    sim.run({ model: 't1', n: s.n, mu: s.ts, sigma: s.sig, theta0: s.t0, B: s.B, seed, ruleA: r.rule, ruleB: zr }, JSON.stringify(['t1', s.n, s.ts, s.sig, s.t0, s.a, s.dir, s.B, seed]))
  }

  const nTable = [5, 10, 30, 100].map((n) => ({ n, size: zRuleSize(s.a, n - 1, s.dir) }))

  return (
    <>
      <StatusBar
        items={[
          ['모형', `X₁…X${'ₙ'} ~ N(μ, σ²), σ 미지, n = ${s.n}`],
          ['가설', `H₀: μ = ${s.t0}  대  H₁: μ ${s.dir === 'R' ? '>' : s.dir === 'L' ? '<' : '≠'} ${s.t0}`],
          ['관측', `x̄ = ${fmtNum(s.x)}, s = ${fmtNum(s.sd)}`],
          ['자유도', String(r.df)],
        ]}
      />
      <LabLayout
        explain={
          <>
            <TextbookBadge>교재 예 7.7 · 프로그램 7.2 · p.274, 288</TextbookBadge>
            <h2 style={{ marginTop: 10 }}>σ를 모를 때: t검정</h2>
            <p>σ 대신 표본표준편차 s를 쓰면 통계량이 더 흔들립니다. 그래서 H₀ 아래 분포는 N(0,1)이 아니라 꼬리가 두꺼운 t(n − 1)입니다(Gosset, 1908).</p>
            <Tex block>{String.raw`T=\frac{\sqrt n(\bar X-\mu_0)}{S}\sim t(n-1)`}</Tex>
            <p>
              <strong>교재 프로그램 7.2</strong>: n = 10에서 t통계량을 z 임계값 1.96과 비교하면 크기가 0.05가 아니라 약 0.082가 됩니다. 아래 "프로그램 7.2 재현"으로 확인해 보세요.
            </p>
            <p className="muted">가능도비검정으로 유도해도 |T|가 큰 값을 기각하는 같은 검정이 나옵니다(예 7.7).</p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <ContinuousChart
                domain={[-span, span]}
                curves={[
                  { fn: (t) => tPdf(t, r.df), color: 'var(--c-null)', fill: 'var(--c-null-fill)', label: `t(${r.df})` },
                  { fn: normPdf, color: 'var(--c-text-tertiary)', fill: 'transparent', label: 'N(0,1)' },
                ]}
                shades={ruleShades(r.rule, 0)}
                vlines={[
                  { x: r.t, label: `관측 t = ${fmtNum(r.t, 3)}` },
                  ...(zr.upper !== undefined ? [{ x: zr.upper, label: 'z 임계값', color: 'var(--c-text-tertiary)' }] : []),
                  ...(zr.lower !== undefined ? [{ x: zr.lower, label: 'z 임계값', color: 'var(--c-text-tertiary)' }] : []),
                ]}
                hist={sim.result?.values ? { values: sim.result.values, bins: 60 } : null}
                ariaLabel={`t(${r.df}) 밀도와 표준정규 밀도. 관측 t = ${fmtNum(r.t, 3)}`}
                xTitle="t"
              />
              <Legend
                items={[
                  { color: 'var(--c-null)', label: `H₀ 아래 t(${r.df}) 밀도` },
                  { color: 'var(--c-text-tertiary)', label: 'N(0,1) 밀도 (σ를 알 때)' },
                  { color: 'var(--c-reject)', label: 't 기각역', pattern: 'hatch' },
                  ...(sim.result ? [{ color: 'var(--c-sim)', label: '시뮬레이션 T', pattern: 'fill' as const }] : []),
                ]}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '자료의 성질', label: 't = √n(x̄ − μ₀)/s', value: fmtNum(r.t, 4), sub: `자유도 ${r.df}`, tone: 'blue' },
                  { tag: '자료의 성질', label: 'p-값 (t분포)', value: fmtP(r.p), sub: `N(0,1)과 잘못 비교하면 ${fmtP(r.pZ)}` },
                  { tag: '규칙의 성질', label: '임계값 (t vs z)', value: `${fmtNum(r.rule.upper ?? -r.rule.lower!, 3)} vs ${fmtNum(zr.upper ?? -zr.lower!, 3)}`, sub: `z 임계값을 쓰면 실제 크기 ${fmtP(sizeZ)}`, tone: 'orange' },
                  { tag: '쌍대성', label: `μ의 ${fmtNum((1 - s.a) * 100, 0)}% 신뢰구간`, value: `[${fmtB(r.ci[0])}, ${fmtB(r.ci[1])}]`, sub: 'x̄ ± t · s/√n' },
                ]}
              />
            </div>
            <div style={{ marginTop: 12 }}>{verdict(reject)}</div>
            <div className="panel" style={{ marginTop: 16 }}>
              <h3>z 임계값을 쓰면 크기가 얼마나 부풀까 (α = {fmtAlpha(s.a)})</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>표본크기 n</th>
                    <th>자유도</th>
                    <th>실제 크기 P(|T| ≥ z)</th>
                  </tr>
                </thead>
                <tbody>
                  {nTable.map((row) => (
                    <tr key={row.n} className={row.n === s.n ? 'in-r' : undefined}>
                      <td>{row.n}</td>
                      <td>{row.n - 1}</td>
                      <td>{fmtP(row.size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="field-hint">n이 커지면 t(n − 1)이 N(0,1)에 가까워져 차이가 줄어듭니다. 교재 프로그램 7.2의 실행 결과(n = 10)는 0.0823이었습니다.</p>
            </div>
            <div className="math-panels panel">
              <Fold title="가능도비검정으로 유도 (교재 예 7.7)" open>
                <p>Ω₀에서는 μ = μ₀이고 σ²만 추정하며, Ω 전체에서는 μ와 σ²를 모두 추정합니다. 정리하면 다음과 같습니다.</p>
                <Tex block>{String.raw`\Lambda=\left(1+\frac{t^2}{n-1}\right)^{-n/2},\qquad -2\log\Lambda=n\log\!\left(1+\frac{t^2}{n-1}\right)`}</Tex>
                <p>
                  Λ는 |t|의 감소함수이므로 기각역은 |T| ≥ t<sub>α/2</sub>(n − 1)입니다. 현재 −2 log Λ = {fmtNum(r.m2logL, 4)}, χ²₁ 근사 p = {fmtP(chi2Sf1(r.m2logL))} (정확한 t 검정 p = {fmtP(r.p)}).
                </p>
              </Fold>
              <Fold title="같은 실험을 R로 (교재 프로그램 7.2와 같은 내용, 사이트 작성 코드)">
                <pre className="code">{`t <- replicate(10000, t.test(rnorm(10))$statistic)
mean(abs(t) > qt(0.975, df = 9))   # 약 0.05
mean(abs(t) > qnorm(0.975))        # 약 0.082`}</pre>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>자료 요약</h3>
              <div className="settings">
                <SliderField label="표본크기 n" value={s.n} min={2} max={100} step={1} onChange={(v) => update({ n: v })} hint="2~200 (직접 입력)" />
                <SliderField label="표본평균 x̄" value={s.x} min={-10} max={10} step={0.01} onChange={(v) => update({ x: v })} />
                <SliderField label="표본표준편차 s" value={s.sd} min={0.01} max={10} step={0.01} onChange={(v) => update({ sd: v })} />
                <SliderField label="귀무값 μ₀" value={s.t0} min={-10} max={10} step={0.01} onChange={(v) => update({ t0: v })} />
              </div>
              <DataPaste label="자료 붙여넣기 (선택)" onApply={(n, m, sd) => update({ n, x: m, sd })} />
              <div style={{ marginTop: 16 }}>
                <CommonFields s={s} update={update} show={{ a: true, dir: ['two', 'R', 'L'] }} />
              </div>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label="반복 실험 (프로그램 7.2)">
              <div className="settings" style={{ marginTop: 12 }}>
                <SliderField label="참 평균 μ*" value={s.ts} min={-10} max={10} step={0.05} onChange={(v) => update({ ts: v })} hint="μ* = μ₀이면 H₀가 참" />
                <SliderField label="참 표준편차 σ" value={s.sig} min={0.1} max={10} step={0.1} onChange={(v) => update({ sig: v })} />
                <button className="btn-ghost" onClick={() => update({ n: 10, t0: 0, ts: 0, sig: 1, a: 0.05, dir: 'two', B: 10000 })}>
                  프로그램 7.2 설정 (n = 10, H₀)
                </button>
              </div>
              {sim.result && (
                <>
                  <SimRate label="t 임계값으로 기각" k={sim.result.rejects} B={sim.result.B} exact={atNull ? s.a : undefined} refLabel="정확한 크기" />
                  <SimRate label="z 임계값으로 기각" k={sim.result.rejects2 ?? 0} B={sim.result.B} exact={atNull ? sizeZ : undefined} refLabel="정확한 크기" />
                  {!atNull && <p className="field-hint">μ* ≠ μ₀이면 기각 비율은 검정력의 추정값입니다.</p>}
                </>
              )}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

/* ---------------- 두 표본 t (예 7.8) ---------------- */

function TwoSample({ s, update }: Props) {
  const r = twoSampleT(s.x, s.sd, s.n, s.y, s.sd2, s.n2, s.t0, s.a, s.dir)
  const pooledRule = useMemo(() => tRule(s.a, r.pooled.df, s.dir), [r.pooled.df, s.a, s.dir])
  const reject = inRule(pooledRule, r.pooled.t)
  const span = Math.max(4.5, Math.abs(r.pooled.t) + 1, Math.abs(r.welch.t) + 1)

  const simKey = JSON.stringify(['t2', s.n, s.n2, s.ts, s.sig, s.sig2, s.t0, s.a, s.dir, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    sim.run(
      { model: 't2', n1: s.n, n2: s.n2, mu1: s.ts, mu2: 0, s1: s.sig, s2: s.sig2, delta0: s.t0, B: s.B, seed, alpha: s.a, dir: s.dir },
      JSON.stringify(['t2', s.n, s.n2, s.ts, s.sig, s.sig2, s.t0, s.a, s.dir, s.B, seed]),
    )
  }
  const atNull = s.ts === s.t0

  return (
    <>
      <StatusBar
        items={[
          ['모형', 'X ~ N(μ₁, σ₁²), Y ~ N(μ₂, σ₂²), 독립'],
          ['가설', `H₀: μ₁ − μ₂ = ${s.t0}  대  H₁: μ₁ − μ₂ ${s.dir === 'R' ? '>' : s.dir === 'L' ? '<' : '≠'} ${s.t0}`],
          ['관측', `x̄ − ȳ = ${fmtNum(s.x - s.y)}`],
        ]}
      />
      <LabLayout
        explain={
          <>
            <TextbookBadge>교재 예 7.8 · p.276~278</TextbookBadge>
            <h2 style={{ marginTop: 10 }}>두 표본 t검정</h2>
            <p>두 모집단의 분산이 같다고 가정하면(σ₁² = σ₂²), 가능도비검정은 합동분산 s<sub>p</sub>²을 쓴 t검정이 됩니다(교재 예 7.8).</p>
            <Tex block>{String.raw`T=\frac{\bar X-\bar Y-\delta_0}{S_p\sqrt{1/n_1+1/n_2}}\sim t(n_1+n_2-2)`}</Tex>
            <p>
              <strong>등분산 가정이 깨지면?</strong> 특히 표본이 작은 쪽의 분산이 크면 합동 t의 실제 크기가 α보다 크게 부풉니다. Welch의 t(교재 범위 밖)는 각 분산을 따로 추정하고 자유도를 근사해 이를 보완합니다. "등분산 위반" 설정으로 시뮬레이션해 보세요.
            </p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <ContinuousChart
                domain={[-span, span]}
                curves={[{ fn: (t) => tPdf(t, r.pooled.df), color: 'var(--c-null)', fill: 'var(--c-null-fill)', label: `t(${r.pooled.df})` }]}
                shades={ruleShades(pooledRule, 0)}
                vlines={[
                  { x: r.pooled.t, label: `합동 t = ${fmtNum(r.pooled.t, 3)}` },
                  { x: r.welch.t, label: `Welch t = ${fmtNum(r.welch.t, 3)}`, color: 'var(--c-alt)' },
                ]}
                hist={sim.result?.values ? { values: sim.result.values, bins: 60 } : null}
                ariaLabel={`합동 t = ${fmtNum(r.pooled.t, 3)}, 자유도 ${r.pooled.df}`}
                xTitle="t"
              />
              <Legend
                items={[
                  { color: 'var(--c-null)', label: `t(${r.pooled.df}) 밀도` },
                  { color: 'var(--c-reject)', label: '합동 t 기각역', pattern: 'hatch' },
                  ...(sim.result ? [{ color: 'var(--c-sim)', label: '시뮬레이션 합동 T', pattern: 'fill' as const }] : []),
                ]}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '합동분산 t (교재)', label: `t, 자유도 ${r.pooled.df}`, value: fmtNum(r.pooled.t, 4), sub: `p = ${fmtP(r.pooled.p)} · sₚ = ${fmtNum(r.pooled.sp, 4)}`, tone: 'blue' },
                  { tag: 'Welch t', label: `t, 자유도 ${fmtNum(r.welch.df, 2)}`, value: fmtNum(r.welch.t, 4), sub: `p = ${fmtP(r.welch.p)}`, tone: 'orange' },
                  { tag: '쌍대성', label: `μ₁ − μ₂의 ${fmtNum((1 - s.a) * 100, 0)}% 신뢰구간 (합동)`, value: `[${fmtB(r.pooled.ci[0])}, ${fmtB(r.pooled.ci[1])}]` },
                  { tag: '쌍대성', label: '신뢰구간 (Welch)', value: `[${fmtB(r.welch.ci[0])}, ${fmtB(r.welch.ci[1])}]` },
                ]}
              />
            </div>
            <div style={{ marginTop: 12 }}>{verdict(reject)}</div>
            <div className="math-panels panel">
              <Fold title="합동분산과 Welch 자유도" open>
                <Tex block>{String.raw`S_p^2=\frac{(n_1-1)S_1^2+(n_2-1)S_2^2}{n_1+n_2-2},\qquad \nu_{\text{Welch}}=\frac{(S_1^2/n_1+S_2^2/n_2)^2}{\frac{(S_1^2/n_1)^2}{n_1-1}+\frac{(S_2^2/n_2)^2}{n_2-1}}`}</Tex>
                <p>교재 예 7.8은 F분포와의 관계(T² ~ F(1, n₁ + n₂ − 2))로도 기각역을 나타냅니다.</p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>두 표본 요약</h3>
              <div className="settings">
                <SliderField label="n₁" value={s.n} min={2} max={100} step={1} onChange={(v) => update({ n: v })} />
                <SliderField label="x̄ (첫째 표본평균)" value={s.x} min={-20} max={20} step={0.01} onChange={(v) => update({ x: v })} />
                <SliderField label="s₁" value={s.sd} min={0.01} max={20} step={0.01} onChange={(v) => update({ sd: v })} />
                <SliderField label="n₂" value={s.n2} min={2} max={100} step={1} onChange={(v) => update({ n2: v })} />
                <SliderField label="ȳ (둘째 표본평균)" value={s.y} min={-20} max={20} step={0.01} onChange={(v) => update({ y: v })} />
                <SliderField label="s₂" value={s.sd2} min={0.01} max={20} step={0.01} onChange={(v) => update({ sd2: v })} />
                <SliderField label="귀무값 δ₀ (μ₁ − μ₂)" value={s.t0} min={-20} max={20} step={0.01} onChange={(v) => update({ t0: v })} />
              </div>
              <DataPaste label="첫째 표본 붙여넣기 (선택)" onApply={(n, m, sd) => update({ n, x: m, sd })} />
              <DataPaste label="둘째 표본 붙여넣기 (선택)" onApply={(n, m, sd) => update({ n2: n, y: m, sd2: sd })} />
              <div style={{ marginTop: 16 }}>
                <CommonFields s={s} update={update} show={{ a: true, dir: ['two', 'R', 'L'] }} />
              </div>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label="반복 실험: 합동 t 대 Welch t">
              <div className="settings" style={{ marginTop: 12 }}>
                <SliderField label="참 차이 μ₁ − μ₂" value={s.ts} min={-20} max={20} step={0.05} onChange={(v) => update({ ts: v })} hint="δ₀와 같으면 H₀가 참" />
                <SliderField label="참 σ₁" value={s.sig} min={0.1} max={10} step={0.1} onChange={(v) => update({ sig: v })} />
                <SliderField label="참 σ₂" value={s.sig2} min={0.1} max={10} step={0.1} onChange={(v) => update({ sig2: v })} />
                <div className="row">
                  <button className="btn-ghost" onClick={() => update({ n: 10, n2: 40, sig: 3, sig2: 1, ts: s.t0, B: 10000 })}>
                    등분산 위반 (작은 표본의 분산이 큼)
                  </button>
                  <button className="btn-ghost" onClick={() => update({ sig: 1, sig2: 1, ts: s.t0 })}>
                    등분산
                  </button>
                </div>
              </div>
              {sim.result && (
                <>
                  <SimRate label="합동 t로 기각" k={sim.result.rejects} B={sim.result.B} exact={atNull ? s.a : undefined} refLabel="목표 α" outsideMsg={s.sig !== s.sig2 ? '— 구간 밖: 등분산 가정이 깨져 크기가 α와 다릅니다' : '— 구간 밖 (B를 늘려 보세요)'} />
                  <SimRate label="Welch t로 기각" k={sim.result.rejects2 ?? 0} B={sim.result.B} exact={atNull ? s.a : undefined} refLabel="목표 α" />
                  {!atNull && <p className="field-hint">참 차이 ≠ δ₀이면 기각 비율은 검정력의 추정값입니다.</p>}
                </>
              )}
            </SimPanel>
          </>
        }
      />
    </>
  )
}
