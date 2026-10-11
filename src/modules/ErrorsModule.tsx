import { useMemo } from 'react'
import { coinAutoRule, coinManualRule, coinPmf, lowerTail, upperTail } from '../engine/coin'
import { decodeRanges, encodeRanges, expectPhi } from '../engine/discrete'
import { normPdf } from '../engine/core/normal'
import { normalPower, stdErr } from '../engine/normal'
import { parseTable, tableSetSize } from '../engine/table'
import { Frac } from '../engine/core/rational'
import type { SimSpec } from '../engine/simulate'
import { DiscreteChart } from '../components/chart/DiscreteChart'
import { ContinuousChart } from '../components/chart/ContinuousChart'
import { LineChart } from '../components/chart/LineChart'
import { Fold, Legend, SliderField, StatGrid, Tex, TextbookBadge } from '../components/ui'
import { SimPanel, SimRate } from '../components/SimPanel'
import { useSimulation } from '../lib/useSimulation'
import { fmtAlpha, fmtNum, fmtP } from '../lib/format'
import type { LabState } from '../state/labState'
import { CommonFields, LabLayout, StatusBar, ensureSeed, type Update } from './common'
import { normalRuleFor } from './PValueModule'
import { TableEditor } from './TableEditor'

interface Props {
  s: LabState
  update: Update
}

export function ErrorsModule({ s, update }: Props) {
  if (s.model === 'normal') return <ErrorsNormal s={s} update={update} />
  if (s.model === 'table') return <ErrorsTable s={s} update={update} />
  return <ErrorsCoin s={s} update={update} />
}

function ErrorsExplain() {
  return (
    <>
      <TextbookBadge>교재 예 7.1 · 그림 7.1~7.3 · p.260</TextbookBadge>
      <h2 style={{ marginTop: 10 }}>잘못 의심하거나, 놓치거나</h2>
      <p>
        <strong>제1종 오류</strong>: H₀가 참인데 기각 (파랑 분포의 빗금 넓이 = α).
        <br />
        <strong>제2종 오류</strong>: H₁이 참인데 기각하지 못함 (주황 분포의 기각역 밖 넓이 = β).
      </p>
      <p>임계값 c를 움직여 보세요. 한쪽 오류를 줄이면 다른 쪽이 커집니다. 그래서 α를 먼저 묶어 두고 그 안에서 검정력을 키우는 것이 최적 검정의 기준이 됩니다 (교재 7.1 끝).</p>
      <p className="muted">반복 판정에서 α의 분모는 H₀ 조건의 반복 수, β의 분모는 H₁ 조건의 반복 수입니다. 두 조건을 섞은 "정확도"는 쓰지 않습니다.</p>
    </>
  )
}

function useTwoSims(baseKey: string) {
  const h0 = useSimulation(`${baseKey}|h0`)
  const h1 = useSimulation(`${baseKey}|h1`)
  return { h0, h1 }
}

/* ---------------- 정규 ---------------- */

function ErrorsNormal({ s, update }: Props) {
  const se = stdErr(s.sd, s.n)
  const dir = s.dir === 'two' ? 'R' : s.dir
  const st = { ...s, dir }
  const rule = normalRuleFor(st)
  const c = dir === 'R' ? rule.upper! : rule.lower!
  const alpha = normalPower(rule, s.t0, s.sd, s.n)
  const power = normalPower(rule, s.t1, s.sd, s.n)
  const beta = 1 - power
  const lo = Math.min(s.t0, s.t1) - 4 * se
  const hi = Math.max(s.t0, s.t1) + 4 * se

  const cGrid = useMemo(() => Array.from({ length: 161 }, (_, i) => lo + ((hi - lo) * i) / 160), [lo, hi])
  const curveA = cGrid.map((cc) => [cc, normalPower(dir === 'R' ? { upper: cc } : { lower: cc }, s.t0, s.sd, s.n)] as [number, number])
  const curveB = cGrid.map((cc) => [cc, 1 - normalPower(dir === 'R' ? { upper: cc } : { lower: cc }, s.t1, s.sd, s.n)] as [number, number])
  const oc = cGrid.map((cc) => {
    const r = dir === 'R' ? { upper: cc } : { lower: cc }
    return [normalPower(r, s.t0, s.sd, s.n), normalPower(r, s.t1, s.sd, s.n)] as [number, number]
  })

  const baseKey = JSON.stringify(['err-n', s.n, s.t0, s.t1, s.sd, rule, s.B, s.seed])
  const { h0, h1 } = useTwoSims(baseKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    const key = JSON.stringify(['err-n', s.n, s.t0, s.t1, s.sd, rule, s.B, seed])
    h0.run({ model: 'normal', n: s.n, theta: s.t0, sigma: s.sd, B: s.B, seed, rule }, `${key}|h0`)
    h1.run({ model: 'normal', n: s.n, theta: s.t1, sigma: s.sd, B: s.B, seed: (seed ^ 0x9e3779b9) >>> 0, rule }, `${key}|h1`)
  }

  const manual = s.rule === 'manual'
  return (
    <>
      <StatusBar
        items={[
          ['모형', `X̄ ~ N(θ, ${s.sd}²/${s.n})`],
          ['가설', `H₀: θ = ${s.t0}  대  H₁: θ = ${s.t1}`],
          ['규칙', `R = {x̄ ${dir === 'R' ? '≥' : '≤'} ${fmtNum(c)}}`],
        ]}
      />
      <LabLayout
        explain={<ErrorsExplain />}
        chart={
          <>
            <div className="panel chart-panel">
              <ContinuousChart
                domain={[lo, hi]}
                curves={[
                  { fn: (x) => normPdf((x - s.t0) / se) / se, color: 'var(--c-null)', fill: 'var(--c-null-fill)', label: 'H₀' },
                  { fn: (x) => normPdf((x - s.t1) / se) / se, color: 'var(--c-alt)', fill: 'var(--c-alt-fill)', label: 'H₁' },
                ]}
                shades={[
                  dir === 'R' ? { curve: 0, from: c, to: Infinity, kind: 'reject' } : { curve: 0, from: -Infinity, to: c, kind: 'reject' },
                  dir === 'R' ? { curve: 1, from: -Infinity, to: c, kind: 'pval' } : { curve: 1, from: c, to: Infinity, kind: 'pval' },
                ]}
                vlines={[{ x: c, label: `c = ${fmtNum(c, 2)}`, color: 'var(--c-reject)', dashed: false }]}
                ariaLabel={`H₀와 H₁ 분포. α ${fmtP(alpha)}, β ${fmtP(beta)}`}
                xTitle="x̄"
              />
              <Legend
                items={[
                  { color: 'var(--c-null)', label: `H₀: θ=${s.t0}` },
                  { color: 'var(--c-alt)', label: `H₁: θ=${s.t1}` },
                  { color: 'var(--c-reject)', label: '제1종 오류 영역 (α)', pattern: 'hatch' },
                  { color: 'var(--c-pval)', label: '제2종 오류 영역 (β)', pattern: 'dots' },
                ]}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '규칙의 성질', label: '제1종 오류 확률 α', value: fmtP(alpha), tone: 'blue' },
                  { tag: `θ = ${s.t1}에서`, label: '제2종 오류 확률 β(θ₁)', value: fmtP(beta), tone: 'orange' },
                  { tag: `θ = ${s.t1}에서`, label: '검정력 1 − β', value: fmtP(power), tone: 'orange' },
                  { tag: '임계값', label: 'c (x̄ 척도)', value: fmtNum(c, 3), sub: `z = ${fmtNum((c - s.t0) / se, 3)}` },
                ]}
              />
            </div>
            <div className="panel chart-panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '4px 4px 8px' }}>c에 따른 두 오류 (교재 그림 7.1·7.2)</h3>
              <LineChart
                xDomain={[lo, hi]}
                series={[
                  { pts: curveA, color: 'var(--c-null)', label: 'α(c)' },
                  { pts: curveB, color: 'var(--c-alt)', label: 'β(c)' },
                ]}
                markers={[
                  { x: c, y: alpha, color: 'var(--c-null)', label: 'α' },
                  { x: c, y: beta, color: 'var(--c-alt)', label: 'β' },
                ]}
                xTitle="임계값 c"
                yTitle="확률"
                ariaLabel="임계값에 따른 제1종, 제2종 오류 확률"
              />
              <Legend items={[{ color: 'var(--c-null)', label: 'α(c): 제1종 오류' }, { color: 'var(--c-alt)', label: 'β(c): 제2종 오류' }]} />
            </div>
            <div className="panel chart-panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '4px 4px 8px' }}>α와 검정력의 관계 (교재 그림 7.3 "검사특성곡선")</h3>
              <LineChart
                xDomain={[0, 1]}
                series={[{ pts: oc, color: 'var(--c-blue)', label: '(α, 검정력)' }, { pts: [[0, 0], [1, 1]], color: 'var(--c-border)', label: '대각선', dashed: true }]}
                markers={[{ x: alpha, y: power, color: 'var(--c-blue)', label: '현재 규칙' }]}
                xTitle="제1종 오류 확률 α"
                yTitle="검정력"
                ariaLabel="제1종 오류 확률과 검정력의 관계 곡선"
              />
              <p className="field-hint" style={{ margin: '0 4px 8px' }}>교재는 이 곡선을 검사특성곡선이라 부릅니다. 일반적으로 OC 곡선은 θ에 따른 채택확률 곡선을 뜻하기도 합니다.</p>
            </div>
            <div className="math-panels panel">
              <Fold title="수식 (교재 식 7.2, 7.3)" open>
                <Tex block>{String.raw`\alpha=P(X\in R\mid H_0),\qquad \beta=P(X\notin R\mid H_1),\qquad \text{검정력}=1-\beta`}</Tex>
                <Tex block>{dir === 'R' ? String.raw`\alpha(c)=1-\Phi\!\left(\tfrac{c-\theta_0}{\sigma/\sqrt n}\right),\quad \beta(c)=\Phi\!\left(\tfrac{c-\theta_1}{\sigma/\sqrt n}\right)` : String.raw`\alpha(c)=\Phi\!\left(\tfrac{c-\theta_0}{\sigma/\sqrt n}\right),\quad \beta(c)=1-\Phi\!\left(\tfrac{c-\theta_1}{\sigma/\sqrt n}\right)`}</Tex>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: true, t0: true, t1: true, sd: true, a: !manual, dir: ['R', 'L'] }} t1Label="대립값 θ₁ (H₁이 참일 때)" />
              <div style={{ marginTop: 16 }}>
                <div className="tab-nav" role="radiogroup" aria-label="규칙 모드">
                  <button type="button" className={`tab-btn${!manual ? ' active' : ''}`} onClick={() => update({ rule: 'auto', c: null })}>
                    α로 정하기
                  </button>
                  <button type="button" className={`tab-btn${manual ? ' active' : ''}`} onClick={() => update({ rule: 'manual', c: Number(c.toFixed(2)) })}>
                    c 직접 움직이기
                  </button>
                </div>
                {manual && (
                  <div style={{ marginTop: 12 }}>
                    <SliderField label={`임계값 c`} value={s.c ?? c} min={Number(lo.toFixed(2))} max={Number(hi.toFixed(2))} step={0.01} onChange={(v) => update({ c: v })} />
                  </div>
                )}
              </div>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={h0.status === 'running' || h1.status === 'running' ? 'running' : h0.status} progress={(h0.progress + h1.progress) / 2} onRun={run} onStop={() => (h0.stop(), h1.stop())} onReset={() => update({ seed: null })} label="조건별 반복 판정" results={[{ label: 'H0', result: h0.result }, { label: 'H1', result: h1.result }]}>
              {h0.result && <SimRate label={`H₀(θ=${s.t0}) 아래 기각 → α 추정`} k={h0.result.rejects} B={h0.result.B} exact={alpha} />}
              {h1.result && <SimRate label={`H₁(θ=${s.t1}) 아래 비기각 → β 추정`} k={h1.result.B - h1.result.rejects} B={h1.result.B} exact={beta} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

/* ---------------- 동전 ---------------- */

function ErrorsCoin({ s, update }: Props) {
  const dir = s.dir === 'two' ? 'R' : s.dir
  const f0 = useMemo(() => coinPmf(s.n, s.t0), [s.n, s.t0])
  const f1 = useMemo(() => coinPmf(s.n, s.t1), [s.n, s.t1])
  const manual = s.rule === 'manual' && s.c !== null
  const auto = useMemo(() => coinAutoRule(s.n, s.t0, s.a, dir), [s.n, s.t0, s.a, dir])
  const c = manual ? s.c! : auto.c
  const phi = useMemo(() => coinManualRule(s.n, c, dir), [s.n, c, dir])
  const alpha = expectPhi(phi, f0)
  const power = expectPhi(phi, f1)
  const steps = Array.from({ length: s.n + 2 }, (_, k) => k + (dir === 'R' ? 0 : -1))
  const curveA = steps.map((cc) => [cc, dir === 'R' ? upperTail(f0, cc) : lowerTail(f0, cc)] as [number, number])
  const curveB = steps.map((cc) => [cc, 1 - (dir === 'R' ? upperTail(f1, cc) : lowerTail(f1, cc))] as [number, number])

  const baseKey = JSON.stringify(['err-c', s.n, s.t0, s.t1, c, dir, s.B, s.seed])
  const { h0, h1 } = useTwoSims(baseKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    const key = JSON.stringify(['err-c', s.n, s.t0, s.t1, c, dir, s.B, seed])
    const base = { model: 'coin' as const, n: s.n, B: s.B, phi: [...phi] }
    h0.run({ ...base, theta: s.t0, seed } satisfies SimSpec, `${key}|h0`)
    h1.run({ ...base, theta: s.t1, seed: (seed ^ 0x9e3779b9) >>> 0 } satisfies SimSpec, `${key}|h1`)
  }

  return (
    <>
      <StatusBar items={[['모형', `X ~ B(${s.n}, θ)`], ['가설', `H₀: θ = ${s.t0}  대  H₁: θ = ${s.t1}`], ['규칙', dir === 'R' ? `R = {x ≥ ${c}}` : `R = {x ≤ ${c}}`]]} />
      <LabLayout
        explain={
          <>
            <ErrorsExplain />
            <p className="note">이산분포에서는 c가 정수 단위로만 움직이므로 α가 계단처럼 변합니다. α를 정확히 0.05로 맞출 수 없는 이유입니다 (교재 7.6).</p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <DiscreteChart
                labels={Array.from({ length: s.n + 1 }, (_, i) => i)}
                theory={[
                  { values: f0, color: 'var(--c-null)', label: 'H₀' },
                  { values: f1, color: 'var(--c-alt)', label: 'H₁' },
                ]}
                phi={phi}
                ariaLabel={`H₀와 H₁ 분포. α ${fmtP(alpha)}, 검정력 ${fmtP(power)}`}
                xTitle="앞면 횟수 x"
              />
              <Legend items={[{ color: 'var(--c-null)', label: `H₀: θ=${s.t0}` }, { color: 'var(--c-alt)', label: `H₁: θ=${s.t1}` }, { color: 'var(--c-reject)', label: '기각역', pattern: 'hatch' }]} />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '규칙의 성질', label: '제1종 오류 확률 (실제 크기)', value: fmtP(alpha), tone: 'blue', sub: `목표 α = ${fmtAlpha(s.a)}` },
                  { tag: `θ = ${s.t1}에서`, label: '제2종 오류 확률 β', value: fmtP(1 - power), tone: 'orange' },
                  { tag: `θ = ${s.t1}에서`, label: '검정력', value: fmtP(power), tone: 'orange' },
                  { tag: '임계값', label: dir === 'R' ? 'x ≥ c이면 기각' : 'x ≤ c이면 기각', value: String(c) },
                ]}
              />
            </div>
            <div className="panel chart-panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '4px 4px 8px' }}>c에 따른 두 오류</h3>
              <LineChart
                xDomain={[steps[0], steps[steps.length - 1]]}
                series={[
                  { pts: curveA, color: 'var(--c-null)', label: 'α(c)' },
                  { pts: curveB, color: 'var(--c-alt)', label: 'β(c)' },
                ]}
                markers={[
                  { x: c, y: alpha, color: 'var(--c-null)', label: 'α' },
                  { x: c, y: 1 - power, color: 'var(--c-alt)', label: 'β' },
                ]}
                hlines={[{ y: s.a, label: `α = ${fmtAlpha(s.a)}` }]}
                xTitle="임계값 c"
                yTitle="확률"
                ariaLabel="임계값에 따른 두 오류 확률"
              />
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: true, t0: true, t1: true, a: true, dir: ['R', 'L'] }} t1Label="대립값 θ₁" />
              <div style={{ marginTop: 16 }}>
                <SliderField
                  label="임계값 c"
                  value={c}
                  min={dir === 'R' ? 0 : -1}
                  max={dir === 'R' ? s.n + 1 : s.n}
                  step={1}
                  onChange={(v) => update({ rule: 'manual', c: v })}
                  hint={manual ? '직접 정한 값입니다.' : 'α로 자동 계산한 값입니다. 움직이면 수동 모드로 바뀝니다.'}
                />
                {manual && (
                  <button className="btn-ghost" onClick={() => update({ rule: 'auto', c: null })}>
                    α로 다시 정하기
                  </button>
                )}
              </div>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={h0.status === 'running' || h1.status === 'running' ? 'running' : h0.status} progress={(h0.progress + h1.progress) / 2} onRun={run} onStop={() => (h0.stop(), h1.stop())} onReset={() => update({ seed: null })} label="조건별 반복 판정" results={[{ label: 'H0', result: h0.result }, { label: 'H1', result: h1.result }]}>
              {h0.result && <SimRate label={`H₀ 아래 기각 → α 추정`} k={h0.result.rejects} B={h0.result.B} exact={alpha} />}
              {h1.result && <SimRate label={`H₁ 아래 비기각 → β 추정`} k={h1.result.B - h1.result.rejects} B={h1.result.B} exact={1 - power} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

/* ---------------- 이산 확률표 ---------------- */

function ErrorsTable({ s, update }: Props) {
  const parsed = useMemo(() => parseTable(s.f0, s.f1), [s.f0, s.f1])
  const K = s.f0.length
  const R = useMemo(() => decodeRanges(s.R, K - 1) ?? [], [s.R, K])
  const toggle = (i: number) => update({ R: encodeRanges(R.includes(i) ? R.filter((x) => x !== i) : [...R, i]) })
  const res = parsed.ok ? tableSetSize(parsed.table, R) : null
  const phi = Array.from({ length: K }, (_, i) => (R.includes(i) ? 1 : 0))
  return (
    <>
      <StatusBar items={[['모형', `이산 확률표 (값 ${K}개)`], ['가설', 'H₀: f = f₀  대  H₁: f = f₁'], ['기각역', `R = {${R.join(', ')}}`]]} />
      <LabLayout
        explain={
          <>
            <ErrorsExplain />
            <p className="note blue">막대를 눌러 기각역 R을 직접 고르세요. 결과는 분수로 정확히 계산됩니다.</p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              {parsed.ok ? (
                <DiscreteChart
                  labels={Array.from({ length: K }, (_, i) => i)}
                  theory={[
                    { values: parsed.table.f0.map((f) => f.toNumber()), color: 'var(--c-null)', label: 'f₀' },
                    { values: parsed.table.f1.map((f) => f.toNumber()), color: 'var(--c-alt)', label: 'f₁' },
                  ]}
                  phi={phi}
                  onToggle={toggle}
                  trim={false}
                  ariaLabel="f₀와 f₁ 막대그래프. 막대를 눌러 기각역 선택"
                  xTitle="x (막대를 눌러 기각역에 넣거나 빼기)"
                />
              ) : (
                <p className="error-text">확률표를 고쳐 주세요.</p>
              )}
              <Legend items={[{ color: 'var(--c-null)', label: 'f₀ (H₀)' }, { color: 'var(--c-alt)', label: 'f₁ (H₁)' }, { color: 'var(--c-reject)', label: '기각역 R', pattern: 'hatch' }]} />
            </div>
            {res && (
              <div style={{ marginTop: 16 }}>
                <StatGrid
                  stats={[
                    { tag: '규칙의 성질', label: 'α = P(X∈R | H₀)', value: res.size.toString(), sub: `≈ ${fmtP(res.size.toNumber())}`, tone: 'blue' },
                    { tag: 'H₁에서', label: 'β = P(X∉R | H₁)', value: Frac.ONE.sub(res.power).toString(), sub: `≈ ${fmtP(1 - res.power.toNumber())}`, tone: 'orange' },
                    { tag: 'H₁에서', label: '검정력', value: res.power.toString(), sub: `≈ ${fmtP(res.power.toNumber())}`, tone: 'orange' },
                    { tag: '기각역', label: 'R', value: R.length ? `{${R.join(', ')}}` : '∅' },
                  ]}
                />
              </div>
            )}
          </>
        }
        settings={<TableEditor s={s} update={update} error={parsed.ok ? null : parsed.error} />}
      />
    </>
  )
}

