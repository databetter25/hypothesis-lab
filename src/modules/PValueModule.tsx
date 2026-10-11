import { useMemo } from 'react'
import { coinAutoRule, coinLogLambda, coinLrtRule, coinManualRule, coinPmf, coinPValue, upperTail } from '../engine/coin'
import { expectPhi, nearlyEqual } from '../engine/discrete'
import { normCdf, normPdf, normSf } from '../engine/core/normal'
import { normalAutoRule, normalPower, normalPValue, stdErr, zStat, type NormalRule } from '../engine/normal'
import { teaPmf, teaPValue } from '../engine/tea'
import type { SimSpec } from '../engine/simulate'
import { DiscreteChart } from '../components/chart/DiscreteChart'
import { ContinuousChart } from '../components/chart/ContinuousChart'
import { Fold, Legend, SliderField, StatGrid, Tex, TextbookBadge, type Stat } from '../components/ui'
import { SimPanel, SimRate } from '../components/SimPanel'
import { useSimulation } from '../lib/useSimulation'
import { fmtAlpha, fmtNum, fmtP } from '../lib/format'
import type { LabState } from '../state/labState'
import { CommonFields, LabLayout, StatusBar, ensureSeed, hypothesisText, verdict, type Update } from './common'

interface Props {
  s: LabState
  update: Update
}

export function PValueModule({ s, update }: Props) {
  if (s.model === 'normal') return <PValueNormal s={s} update={update} />
  return <PValueDiscrete s={s} update={update} />
}

/* ---------------- 이산 (동전·홍차) ---------------- */

function PValueDiscrete({ s, update }: Props) {
  const isTea = s.model === 'tea'
  const n = isTea ? 4 : s.n
  const dir = isTea ? 'R' : s.dir

  const calc = useMemo(() => {
    const f0 = isTea ? teaPmf().map((f) => f.toNumber()) : coinPmf(n, s.t0)
    const fs = isTea ? f0 : coinPmf(n, s.ts)
    let phi: Float64Array
    let c: number | null = null
    let nextSize: number | null = null
    if (dir === 'two') {
      phi = coinLrtRule(n, s.t0, s.a).phi
    } else if (s.rule === 'manual' && s.c !== null) {
      c = s.c
      phi = coinManualRule(n, s.c, dir)
    } else if (isTea) {
      // 우측 자동 규칙 (동전과 같은 원리)
      let cc = n + 1
      while (cc - 1 >= 0 && upperTail(f0, cc - 1) <= s.a) cc--
      c = cc
      phi = coinManualRule(n, cc, 'R')
      nextSize = cc - 1 >= 0 ? upperTail(f0, cc - 1) : null
    } else {
      const r = coinAutoRule(n, s.t0, s.a, dir)
      phi = r.phi
      c = r.c
      nextSize = r.nextSize
    }
    const size = expectPhi(phi, f0)
    const x = Math.min(s.x, n)
    const pTail = isTea ? teaPValue(x).toNumber() : coinPValue(n, s.t0, x, dir === 'two' ? 'two-tail' : dir)
    const pLrt = !isTea && dir === 'two' ? coinPValue(n, s.t0, x, 'two-lrt') : null
    const ll = !isTea && dir === 'two' ? coinLogLambda(n, s.t0) : null
    const pRegion = Array.from({ length: n + 1 }, (_, u) =>
      dir === 'R' ? u >= x : dir === 'L' ? u <= x : ll ? ll[u] <= ll[x] || nearlyEqual(ll[u], ll[x]) : false,
    )
    const p = pLrt ?? pTail
    return { f0, fs, phi, c, nextSize, size, x, pTail, pLrt, p, pRegion, powerTs: expectPhi(phi, fs) }
  }, [isTea, n, s.t0, s.ts, s.a, s.rule, s.c, s.x, dir])

  const inR = calc.phi[calc.x] === 1
  const simKey = JSON.stringify(['pv', s.model, n, s.ts, [...calc.phi], s.B, s.seed])
  const sim = useSimulation(simKey)
  const runSim = () => {
    const seed = ensureSeed(s, update)
    const spec: SimSpec = isTea ? { model: 'tea', B: s.B, seed, phi: [...calc.phi] } : { model: 'coin', n, theta: s.ts, B: s.B, seed, phi: [...calc.phi] }
    sim.run(spec, JSON.stringify(['pv', s.model, n, s.ts, [...calc.phi], s.B, seed]))
  }
  const simRel = sim.result?.counts ? sim.result.counts.map((k) => k / sim.result!.B) : null

  const ruleText =
    dir === 'two' ? 'R = {Λ가 작은 값} (가능도비검정)' : calc.c === null ? '' : dir === 'R' ? (calc.c > n ? 'R = ∅ (기각하지 않음)' : `R = {x ≥ ${calc.c}}`) : calc.c < 0 ? 'R = ∅' : `R = {x ≤ ${calc.c}}`

  const stats: Stat[] = [
    { tag: '규칙의 성질', label: '유의수준 α (목표)', value: fmtAlpha(s.a) },
    { tag: '규칙의 성질', label: '실제 크기 P(X∈R | H₀)', value: fmtP(calc.size), sub: calc.nextSize !== null && s.rule === 'auto' ? `한 칸 넓히면 ${fmtP(calc.nextSize)}` : undefined, tone: 'blue' },
    { tag: '자료의 성질', label: dir === 'two' ? 'p-값 (Λ 순서)' : 'p-값', value: fmtP(calc.p), sub: calc.pLrt !== null ? `꼬리×2 방식: ${fmtP(calc.pTail)}` : undefined },
    { tag: 'θ*에서의 성질', label: isTea ? '무작위 추측 시 기각 확률' : `θ* = ${s.ts}에서 기각 확률`, value: fmtP(calc.powerTs), tone: 'orange' },
  ]

  const labels = Array.from({ length: n + 1 }, (_, i) => i)

  return (
    <>
      <StatusBar
        items={[
          ['모형', isTea ? '8잔 중 4잔 고르기, K = 정답 수' : `X ~ B(${n}, θ)`],
          ['가설', hypothesisText(s)],
          ['관측', `x = ${calc.x}`],
          ['규칙', ruleText],
        ]}
      />
      <LabLayout
        explain={
          <>
            {isTea ? (
              <>
                <TextbookBadge>교재 7.1 · p.257</TextbookBadge>
                <h2 style={{ marginTop: 10 }}>홍차 감별 실험</h2>
                <p>어떤 사람이 홍차에 우유를 먼저 넣었는지 차를 먼저 넣었는지 구별할 수 있다고 주장합니다. 8잔(각 4잔) 중 "차를 먼저 넣은" 4잔을 고르게 했습니다.</p>
                <p>
                  <strong>Fisher의 논리</strong>: 감별 능력이 없다고 가정하면, 4잔을 모두 맞힐 확률은 1/70 ≈ 0.0143입니다. 이 값이 작다는 것은 귀무가설에 대한 <em>반대 증거</em>입니다. 대립가설은 세우지 않았습니다.
                </p>
              </>
            ) : (
              <>
                <TextbookBadge>교재 정의 7.1③ · p.263</TextbookBadge>
                <h2 style={{ marginTop: 10 }}>p-값은 얼마나 드문가</h2>
                <p>
                  p-값은 <strong>H₀가 참이라고 가정할 때</strong> 관측값만큼 또는 그보다 극단적인 값을 얻을 확률입니다. 그래프의 점무늬가 그 영역입니다.
                </p>
                <p>α를 바꿔 보세요. 기각역(빗금)은 바뀌지만 p-값은 그대로입니다. α는 규칙의 성질이고 p-값은 자료의 성질입니다.</p>
              </>
            )}
            <p className="muted">판정: [x ∈ R]과 [p-값 ≤ α]는 언제나 같은 결론을 냅니다.</p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <DiscreteChart
                labels={labels}
                theory={[{ values: calc.f0, color: 'var(--c-null)', label: 'H₀ 분포' }]}
                sim={simRel}
                phi={calc.phi}
                pRegion={calc.pRegion}
                observed={calc.x}
                onToggle={(i) => update({ x: i })}
                ariaLabel={`귀무분포 막대그래프. 관측값 ${calc.x}, p-값 ${fmtP(calc.p)}, 실제 크기 ${fmtP(calc.size)}`}
                xTitle={isTea ? '정답 수 K' : '앞면 횟수 x  (막대를 눌러 관측값 선택)'}
              />
              <Legend
                items={[
                  { color: 'var(--c-null)', label: 'H₀ 아래 확률' },
                  { color: 'var(--c-reject)', label: '기각역 R', pattern: 'hatch' },
                  { color: 'var(--c-pval)', label: 'p-값 영역', pattern: 'dots' },
                  { color: 'var(--c-obs)', label: '관측값', pattern: 'line' },
                  ...(simRel ? [{ color: 'var(--c-sim)', label: isTea ? '시뮬레이션 상대빈도 (무작위 추측)' : `시뮬레이션 상대빈도 (θ*=${s.ts})`, pattern: 'fill' as const }] : []),
                ]}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid stats={stats} />
            </div>
            <div style={{ marginTop: 12 }}>{verdict(inR)}</div>
            <div className="math-panels panel">
              <Fold title="수식" open>
                {isTea ? (
                  <Tex block>{String.raw`P(K=k)=\frac{\binom{4}{k}\binom{4}{4-k}}{\binom{8}{4}},\quad P(K=4)=\frac{1}{70}\approx 0.0143`}</Tex>
                ) : dir === 'two' ? (
                  <>
                    <Tex block>{String.raw`p_{\Lambda}(x)=\sum_{u:\,\Lambda(u)\le\Lambda(x)} f(u\mid\theta_0),\qquad p_{2\times}(x)=\min\{1,\,2\min(P(X\le x),P(X\ge x))\}`}</Tex>
                    <p className="muted">θ₀=0.5이면 두 값이 같고, 그 밖에는 다를 수 있습니다 (가능도비검정 모듈 참고).</p>
                  </>
                ) : (
                  <Tex block>{dir === 'R' ? String.raw`p(x)=P(X\ge x\mid H_0)=\sum_{u=x}^{n}\binom{n}{u}\theta_0^{u}(1-\theta_0)^{n-u}` : String.raw`p(x)=P(X\le x\mid H_0)=\sum_{u=0}^{x}\binom{n}{u}\theta_0^{u}(1-\theta_0)^{n-u}`}</Tex>
                )}
                <p>
                  자동 임계값: <Tex>{dir === 'L' ? String.raw`c_L=\max\{c: P_{\theta_0}(X\le c)\le\alpha\}` : String.raw`c=\min\{c: P_{\theta_0}(X\ge c)\le\alpha\}`}</Tex>. 이산분포라서 실제 크기가 α보다 작을 수 있습니다.
                </p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: !isTea, t0: !isTea, a: true, dir: isTea ? false : ['R', 'L', 'two'], ts: !isTea }} />
              <div style={{ marginTop: 16 }}>
                <SliderField label={isTea ? '관측 정답 수 k' : '관측값 x'} value={calc.x} min={0} max={n} step={1} onChange={(v) => update({ x: v })} />
              </div>
              {dir !== 'two' && (
                <div style={{ marginTop: 16 }}>
                  <div className="field">
                    <span className="field-label">규칙 모드</span>
                    <div className="tab-nav" role="radiogroup" aria-label="규칙 모드">
                      <button type="button" role="radio" aria-checked={s.rule === 'auto'} className={`tab-btn${s.rule === 'auto' ? ' active' : ''}`} onClick={() => update({ rule: 'auto', c: null })}>
                        α로 정하기
                      </button>
                      <button type="button" role="radio" aria-checked={s.rule === 'manual'} className={`tab-btn${s.rule === 'manual' ? ' active' : ''}`} onClick={() => update({ rule: 'manual', c: calc.c ?? (dir === 'R' ? n : 0) })}>
                        c로 탐색하기
                      </button>
                    </div>
                  </div>
                  {s.rule === 'manual' && (
                    <div style={{ marginTop: 12 }}>
                      <SliderField label={dir === 'R' ? '임계값 c (x ≥ c이면 기각)' : '임계값 c (x ≤ c이면 기각)'} value={s.c ?? 0} min={dir === 'R' ? 0 : -1} max={dir === 'R' ? n + 1 : n} step={1} onChange={(v) => update({ c: v })} />
                    </div>
                  )}
                </div>
              )}
            </div>
            <SimPanel
              B={s.B}
              onB={(b) => update({ B: b })}
              seed={s.seed}
              status={sim.status} results={[{ label: 'sim', result: sim.result }]}
              progress={sim.progress}
              onRun={() => runSim()}
              onStop={sim.stop}
              onReset={() => update({ seed: null })}
              label={isTea ? '무작위 추측 반복' : `θ* = ${s.ts}에서 반복 실험`}
            >
              {sim.result && <SimRate label="기각 비율" k={sim.result.rejects} B={sim.result.B} exact={calc.powerTs} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

/* ---------------- 정규 ---------------- */

export function normalRuleFor(s: LabState): NormalRule {
  if (s.rule === 'manual' && s.c !== null && s.dir !== 'two') return s.dir === 'R' ? { upper: s.c } : { lower: s.c }
  return normalAutoRule(s.t0, s.sd, s.n, s.a, s.dir)
}

function PValueNormal({ s, update }: Props) {
  const se = stdErr(s.sd, s.n)
  const rule = normalRuleFor(s)
  const size = normalPower(rule, s.t0, s.sd, s.n)
  const p = normalPValue(s.x, s.t0, s.sd, s.n, s.dir)
  const z = zStat(s.x, s.t0, s.sd, s.n)
  const powerTs = normalPower(rule, s.ts, s.sd, s.n)
  const inR = (rule.upper !== undefined && s.x >= rule.upper) || (rule.lower !== undefined && s.x <= rule.lower)
  const lo = Math.min(s.t0, s.ts) - 4 * se
  const hi = Math.max(s.t0, s.ts) + 4 * se
  const d0 = Math.min(lo, s.x - se)
  const d1 = Math.max(hi, s.x + se)

  const simKey = JSON.stringify(['pvn', s.n, s.ts, s.sd, rule, s.B, s.seed])
  const sim = useSimulation(simKey)
  const runSim = () => {
    const seed = ensureSeed(s, update)
    sim.run({ model: 'normal', n: s.n, theta: s.ts, sigma: s.sd, B: s.B, seed, rule }, JSON.stringify(['pvn', s.n, s.ts, s.sd, rule, s.B, seed]))
  }

  const dens0 = (x: number) => normPdf((x - s.t0) / se) / se
  const pShades =
    s.dir === 'R'
      ? [{ curve: 0, from: s.x, to: Infinity, kind: 'pval' as const }]
      : s.dir === 'L'
        ? [{ curve: 0, from: -Infinity, to: s.x, kind: 'pval' as const }]
        : [
            { curve: 0, from: s.t0 + Math.abs(s.x - s.t0), to: Infinity, kind: 'pval' as const },
            { curve: 0, from: -Infinity, to: s.t0 - Math.abs(s.x - s.t0), kind: 'pval' as const },
          ]
  const rShades = [
    ...(rule.upper !== undefined ? [{ curve: 0, from: rule.upper, to: Infinity, kind: 'reject' as const }] : []),
    ...(rule.lower !== undefined ? [{ curve: 0, from: -Infinity, to: rule.lower, kind: 'reject' as const }] : []),
  ]
  const ruleText = [rule.upper !== undefined ? `x̄ ≥ ${fmtNum(rule.upper)}` : null, rule.lower !== undefined ? `x̄ ≤ ${fmtNum(rule.lower)}` : null].filter(Boolean).join(' 또는 ')

  return (
    <>
      <StatusBar
        items={[
          ['모형', `X₁…X${'ₙ'} ~ N(θ, ${s.sd}²), n = ${s.n}`],
          ['가설', hypothesisText(s)],
          ['관측', `x̄ = ${fmtNum(s.x)} (z = ${fmtNum(z, 3)})`],
          ['규칙', `R = {${ruleText}}`],
        ]}
      />
      <LabLayout
        explain={
          <>
            <TextbookBadge>교재 예 7.6 · 프로그램 7.1</TextbookBadge>
            <h2 style={{ marginTop: 10 }}>정규 평균의 z검정</h2>
            <p>σ를 알 때 표본평균 X̄는 N(θ, σ²/n)을 따릅니다. 귀무가설 아래 분포(파랑)에서 관측값보다 극단적인 영역(점무늬)의 넓이가 p-값입니다.</p>
            <p>연속분포에서는 실제 크기가 정확히 α와 같습니다. 이산분포인 동전과 비교해 보세요.</p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <ContinuousChart
                domain={[d0, d1]}
                curves={[{ fn: dens0, color: 'var(--c-null)', fill: 'var(--c-null-fill)', label: 'H₀' }]}
                shades={[...rShades, ...pShades]}
                vlines={[{ x: s.x, label: `관측 x̄` }]}
                hist={sim.result?.values ? { values: sim.result.values, bins: 50 } : null}
                ariaLabel={`귀무분포 밀도. 관측 x̄ ${fmtNum(s.x)}, p-값 ${fmtP(p)}`}
                xTitle="표본평균 x̄"
              />
              <Legend
                items={[
                  { color: 'var(--c-null)', label: 'H₀ 아래 X̄의 밀도' },
                  { color: 'var(--c-reject)', label: '기각역', pattern: 'hatch' },
                  { color: 'var(--c-pval)', label: 'p-값 영역', pattern: 'dots' },
                  { color: 'var(--c-obs)', label: '관측값', pattern: 'line' },
                  ...(sim.result ? [{ color: 'var(--c-sim)', label: `시뮬레이션 x̄ 히스토그램 (θ*=${s.ts})`, pattern: 'fill' as const }] : []),
                ]}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '규칙의 성질', label: '유의수준 α', value: fmtAlpha(s.a) },
                  { tag: '규칙의 성질', label: '실제 크기', value: fmtP(size), tone: 'blue' },
                  { tag: '자료의 성질', label: 'p-값', value: fmtP(p), sub: `z = ${fmtNum(z, 3)}` },
                  { tag: 'θ*에서의 성질', label: `θ* = ${s.ts}에서 기각 확률`, value: fmtP(powerTs), tone: 'orange' },
                ]}
              />
            </div>
            <div style={{ marginTop: 12 }}>{verdict(inR)}</div>
            <div className="math-panels panel">
              <Fold title="수식" open>
                <Tex block>{String.raw`Z=\frac{\sqrt{n}(\bar X-\theta_0)}{\sigma}\sim N(0,1)\ \text{(H}_0\text{ 아래)}`}</Tex>
                <Tex block>{s.dir === 'R' ? String.raw`p=1-\Phi(z),\quad R=\{z\ge z_\alpha\}` : s.dir === 'L' ? String.raw`p=\Phi(z),\quad R=\{z\le -z_\alpha\}` : String.raw`p=2\{1-\Phi(|z|)\},\quad R=\{|z|\ge z_{\alpha/2}\}`}</Tex>
                <p className="muted">
                  Φ(1.645) ≈ 0.95, Φ(1.96) ≈ 0.975. 현재 1 − Φ(z) = {fmtP(normSf(z))}, Φ(z) = {fmtP(normCdf(z))}
                </p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: true, t0: true, sd: true, a: true, dir: ['R', 'L', 'two'], ts: true }} />
              <div style={{ marginTop: 16 }}>
                <SliderField label="관측 x̄" value={s.x} min={Number((s.t0 - 5 * se).toFixed(2))} max={Number((s.t0 + 5 * se).toFixed(2))} step={0.01} onChange={(v) => update({ x: v })} />
              </div>
              {s.dir !== 'two' && (
                <div style={{ marginTop: 16 }}>
                  <div className="tab-nav" role="radiogroup" aria-label="규칙 모드">
                    <button type="button" className={`tab-btn${s.rule === 'auto' ? ' active' : ''}`} onClick={() => update({ rule: 'auto', c: null })}>
                      α로 정하기
                    </button>
                    <button type="button" className={`tab-btn${s.rule === 'manual' ? ' active' : ''}`} onClick={() => update({ rule: 'manual', c: Number((s.dir === 'R' ? rule.upper! : rule.lower!).toFixed(2)) })}>
                      c로 탐색하기
                    </button>
                  </div>
                  {s.rule === 'manual' && (
                    <div style={{ marginTop: 12 }}>
                      <SliderField label={`임계값 c (x̄ ${s.dir === 'R' ? '≥' : '≤'} c이면 기각)`} value={s.c ?? 0} min={Number((s.t0 - 4 * se).toFixed(2))} max={Number((s.t0 + 4 * se).toFixed(2))} step={0.01} onChange={(v) => update({ c: v })} />
                    </div>
                  )}
                </div>
              )}
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={runSim} onStop={sim.stop} onReset={() => update({ seed: null })} label={`θ* = ${s.ts}에서 반복 실험`}>
              {sim.result && <SimRate label="기각 비율" k={sim.result.rejects} B={sim.result.B} exact={powerTs} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

