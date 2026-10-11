import { useMemo, useState } from 'react'
import { coinLogRatio, coinPmf } from '../engine/coin'
import { decodeRanges, encodeRanges, expectPhi, npRandomized } from '../engine/discrete'
import { normPdf } from '../engine/core/normal'
import { Frac } from '../engine/core/rational'
import { normalNP, normalPower, stdErr } from '../engine/normal'
import { parseTable, ratioLabel, tableBestNonRandomized, tableNP, tableSetSize } from '../engine/table'
import { DiscreteChart } from '../components/chart/DiscreteChart'
import { ContinuousChart } from '../components/chart/ContinuousChart'
import { Fold, Legend, StatGrid, Tex, TextbookBadge } from '../components/ui'
import { SimPanel, SimRate } from '../components/SimPanel'
import { useSimulation } from '../lib/useSimulation'
import { fmtAlpha, fmtNum, fmtP } from '../lib/format'
import type { LabState } from '../state/labState'
import { CommonFields, LabLayout, StatusBar, ensureSeed, type Update } from './common'
import { TableEditor } from './TableEditor'

interface Props {
  s: LabState
  update: Update
}

type View = 'mine' | 'np' | 'best'

export function NPModule({ s, update }: Props) {
  if (s.model === 'table') return <NPTable s={s} update={update} />
  if (s.model === 'normal') return <NPNormal s={s} update={update} />
  return <NPCoin s={s} update={update} />
}

function NPExplain({ table }: { table?: boolean }) {
  return (
    <>
      <TextbookBadge>교재 정의 7.2 · 정리 7.1 · p.264~265</TextbookBadge>
      <h2 style={{ marginTop: 10 }}>같은 α에서 가장 잘 발견하는 규칙</h2>
      <p>
        <strong>최강력검정</strong>: 크기가 α 이하인 검정 중 H₁ 아래 검정력이 가장 큰 검정입니다.
      </p>
      <p>
        <strong>네이만–피어슨 보조정리</strong>: 가능도비 f₁(x)/f₀(x)가 <em>큰 값부터</em> 기각역에 넣으면 됩니다. 경계에서 α를 넘으면 그 값은 확률 γ로만 기각합니다(검정함수, 교재 7.6).
      </p>
      {table && <p className="note blue">먼저 막대를 눌러 크기 ≤ α인 기각역을 직접 만들어 보세요. 그다음 보조정리 규칙, 비확률화 최선과 비교합니다.</p>}
    </>
  )
}

/* ---------------- 이산 확률표 ---------------- */

function NPTable({ s, update }: Props) {
  const [view, setView] = useState<View>('mine')
  const parsed = useMemo(() => parseTable(s.f0, s.f1), [s.f0, s.f1])
  const K = s.f0.length
  const R = useMemo(() => decodeRanges(s.R, K - 1) ?? [], [s.R, K])
  const alphaF = useMemo(() => Frac.tryParse(String(s.a)) ?? Frac.of(5, 100), [s.a])
  const toggle = (i: number) => {
    setView('mine')
    update({ R: encodeRanges(R.includes(i) ? R.filter((x) => x !== i) : [...R, i]) })
  }

  const calc = useMemo(() => {
    if (!parsed.ok) return null
    const t = parsed.table
    const mine = tableSetSize(t, R)
    const np = tableNP(t, alphaF)
    const best = tableBestNonRandomized(t, alphaF)
    return { t, mine, np, best }
  }, [parsed, R, alphaF])

  const phiNum = useMemo(() => {
    if (!calc) return new Array(K).fill(0)
    if (view === 'np') return calc.np.phi.map((f) => f.toNumber())
    if (view === 'best') return Array.from({ length: K }, (_, i) => (calc.best.reject.includes(i) ? 1 : 0))
    return Array.from({ length: K }, (_, i) => (R.includes(i) ? 1 : 0))
  }, [calc, view, R, K])

  const simKey = JSON.stringify(['np-t', s.f0, s.f1, phiNum, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    if (!calc) return
    const seed = ensureSeed(s, update)
    sim.run({ model: 'table', probs: calc.t.f0.map((f) => f.toNumber()), B: s.B, seed, phi: phiNum }, JSON.stringify(['np-t', s.f0, s.f1, phiNum, s.B, seed]))
  }

  const over = calc ? calc.mine.size.cmp(alphaF) > 0 : false
  const cur = calc ? (view === 'np' ? { size: calc.np.size, power: calc.np.power } : view === 'best' ? { size: calc.best.size, power: calc.best.power } : calc.mine) : null

  return (
    <>
      <StatusBar items={[['모형', `이산 확률표 (값 ${K}개)`], ['가설', 'H₀: f = f₀  대  H₁: f = f₁'], ['α', fmtAlpha(s.a)]]} />
      <LabLayout
        explain={<NPExplain table />}
        chart={
          <>
            <div className="panel chart-panel">
              <div className="tab-nav" role="radiogroup" aria-label="보기" style={{ margin: '4px 4px 10px' }}>
                {(
                  [
                    ['mine', '내가 만든 기각역'],
                    ['np', '보조정리 규칙 (확률화)'],
                    ['best', '비확률화 최선'],
                  ] as const
                ).map(([v, l]) => (
                  <button key={v} type="button" className={`tab-btn${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
                    {l}
                  </button>
                ))}
              </div>
              {calc ? (
                <DiscreteChart
                  labels={Array.from({ length: K }, (_, i) => i)}
                  theory={[
                    { values: calc.t.f0.map((f) => f.toNumber()), color: 'var(--c-null)', label: 'f₀' },
                    { values: calc.t.f1.map((f) => f.toNumber()), color: 'var(--c-alt)', label: 'f₁' },
                  ]}
                  phi={phiNum}
                  onToggle={toggle}
                  trim={false}
                  sim={sim.result?.counts ? sim.result.counts.map((c) => c / sim.result!.B) : null}
                  ariaLabel="f₀, f₁ 막대그래프와 기각역"
                  xTitle="x (막대를 눌러 내 기각역 고치기)"
                />
              ) : (
                <p className="error-text">확률표를 고쳐 주세요.</p>
              )}
              <Legend items={[{ color: 'var(--c-null)', label: 'f₀' }, { color: 'var(--c-alt)', label: 'f₁' }, { color: 'var(--c-reject)', label: '기각 (진할수록 φ가 큼)', pattern: 'hatch' }]} />
            </div>
            {calc && cur && (
              <>
                <div style={{ marginTop: 16 }}>
                  <StatGrid
                    stats={[
                      { tag: '크기', label: 'P(X∈R | H₀) = E₀[φ]', value: cur.size.toString(), sub: `≈ ${fmtP(cur.size.toNumber())}${view === 'mine' && over ? ' · α 초과!' : ''}`, tone: 'blue' },
                      { tag: '검정력', label: 'P(X∈R | H₁) = E₁[φ]', value: cur.power.toString(), sub: `≈ ${fmtP(cur.power.toNumber())}`, tone: 'orange' },
                    ]}
                  />
                </div>
                {view === 'mine' && (
                  <div className={`verdict ${over ? 'reject' : 'keep'}`} style={{ marginTop: 12 }}>
                    {over
                      ? `크기 ${calc.mine.size} > α 이므로 "수준 α 검정"이 아닙니다.`
                      : calc.mine.power.cmp(calc.best.power) === 0
                        ? '수준 α 비확률화 검정 중 최선입니다!'
                        : `수준 α 검정입니다. 비확률화 최선의 검정력은 ${calc.best.power}입니다.`}
                  </div>
                )}
                {view === 'np' && (
                  <p className="note blue" style={{ marginTop: 12 }}>
                    φ: {calc.np.phi.map((p, i) => `φ(${i})=${p.toString()}`).join(', ')}
                    {calc.np.gamma && ` — 경계 x = ${calc.np.boundary.join(', ')}에서 γ = ${calc.np.gamma}`}
                  </p>
                )}
                <div className="panel" style={{ marginTop: 16 }}>
                  <h3>값별 가능도비</h3>
                  <div className="table-scroll" tabIndex={0} role="region" aria-label="표 (넘치면 가로·세로로 스크롤)">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>x</th>
                          <th>f₀(x)</th>
                          <th>f₁(x)</th>
                          <th>f₁/f₀</th>
                          <th>순위</th>
                          <th>φ(x)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: K }, (_, i) => (
                          <tr key={i} className={phiNum[i] > 0 ? 'in-r' : undefined}>
                            <td>{i}</td>
                            <td>{calc.t.f0[i].toString()}</td>
                            <td>{calc.t.f1[i].toString()}</td>
                            <td>{ratioLabel(calc.t, i)}</td>
                            <td>{calc.np.groups.findIndex((g) => g.includes(i)) + 1 || '—'}</td>
                            <td>{view === 'np' ? calc.np.phi[i].toString() : phiNum[i]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
            <div className="math-panels panel">
              <Fold title="네이만–피어슨 보조정리 (교재 정리 7.1)" open>
                <Tex block>{String.raw`R=\left\{x:\ \frac{f(x\mid\theta_1)}{f(x\mid\theta_0)}>k\right\},\qquad P(X\in R\mid H_0)=\alpha`}</Tex>
                <p>이산분포에서는 경계값에서 확률화한 검정함수로 크기를 정확히 α에 맞춥니다 (교재 식 7.34~7.36).</p>
                <Tex block>{String.raw`\varphi(x)=\begin{cases}1 & f_1/f_0>k\\ \gamma & f_1/f_0=k\\ 0 & f_1/f_0<k\end{cases},\qquad \gamma=\frac{\alpha-P_0(f_1/f_0>k)}{P_0(f_1/f_0=k)}`}</Tex>
              </Fold>
              <Fold title="증명 개요 (교재 예 7.2)">
                <p>보조정리 규칙을 φ*, 임의의 수준 α 검정을 φ라 하면, 모든 x에서 다음이 성립합니다.</p>
                <Tex block>{String.raw`\{\varphi^*(x)-\varphi(x)\}\{f_1(x)-k f_0(x)\}\ge 0`}</Tex>
                <p>이를 x에 대해 더하면 아래 식을 얻습니다. 마지막 부등호는 E₀[φ*] = α ≥ E₀[φ]에서 나옵니다.</p>
                <Tex block>{String.raw`E_1[\varphi^*]-E_1[\varphi]\ \ge\ k\{E_0[\varphi^*]-E_0[\varphi]\}\ \ge 0`}</Tex>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ a: true }} />
            </div>
            <TableEditor s={s} update={update} error={parsed.ok ? null : parsed.error} />
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label="H₀ 아래 반복 판정 (확률화 포함)">
              {sim.result && cur && <SimRate label="기각 비율 → 크기 추정" k={sim.result.rejects} B={sim.result.B} exact={cur.size.toNumber()} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

/* ---------------- 동전 ---------------- */

function NPCoin({ s, update }: Props) {
  const [view, setView] = useState<View>('np')
  const f0 = useMemo(() => coinPmf(s.n, s.t0), [s.n, s.t0])
  const f1 = useMemo(() => coinPmf(s.n, s.t1), [s.n, s.t1])
  const np = useMemo(() => npRandomized(f0, f1, s.a, coinLogRatio(s.n, s.t0, s.t1)), [f0, f1, s.a, s.n, s.t0, s.t1])
  const R = useMemo(() => decodeRanges(s.R, s.n) ?? [], [s.R, s.n])
  const minePhi = useMemo(() => Array.from({ length: s.n + 1 }, (_, i) => (R.includes(i) ? 1 : 0)), [R, s.n])
  const phi = view === 'np' ? [...np.phi] : minePhi
  const size = expectPhi(phi, f0)
  const power = expectPhi(phi, f1)
  const npPower = expectPhi(np.phi, f1)
  const toggle = (i: number) => {
    setView('mine')
    update({ R: encodeRanges(R.includes(i) ? R.filter((x) => x !== i) : [...R, i]) })
  }
  const sideText = s.t1 > s.t0 ? '오른쪽 꼬리 (큰 x)' : '왼쪽 꼬리 (작은 x)'

  const simKey = JSON.stringify(['np-c', s.n, s.t0, phi, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    sim.run({ model: 'coin', n: s.n, theta: s.t0, B: s.B, seed, phi }, JSON.stringify(['np-c', s.n, s.t0, phi, s.B, seed]))
  }

  return (
    <>
      <StatusBar items={[['모형', `X ~ B(${s.n}, θ)`], ['가설', `H₀: θ = ${s.t0}  대  H₁: θ = ${s.t1}`], ['α', fmtAlpha(s.a)]]} />
      <LabLayout
        explain={
          <>
            <NPExplain />
            <h3>θ₁을 움직여 보세요 (UMP)</h3>
            <p>θ₁ &gt; θ₀인 동안에는 보조정리 기각역이 전혀 바뀌지 않습니다. 가능도비가 x의 증가함수이기 때문입니다(단조가능도비). 따라서 이 검정은 H₁: θ &gt; θ₀ 전체에서 최강력, 즉 <strong>균일최강력(UMP)</strong>입니다.</p>
            <p>θ₁을 θ₀보다 작게 넘기면 기각역이 반대쪽 꼬리로 뒤집힙니다. 그래서 양측 대립 θ ≠ θ₀에는 UMP가 없습니다. 이것이 가능도비검정으로 넘어가는 이유입니다.</p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <div className="tab-nav" style={{ margin: '4px 4px 10px' }}>
                <button className={`tab-btn${view === 'np' ? ' active' : ''}`} onClick={() => setView('np')}>
                  보조정리 규칙
                </button>
                <button className={`tab-btn${view === 'mine' ? ' active' : ''}`} onClick={() => setView('mine')}>
                  내가 만든 기각역
                </button>
              </div>
              <DiscreteChart
                labels={Array.from({ length: s.n + 1 }, (_, i) => i)}
                theory={[
                  { values: f0, color: 'var(--c-null)', label: 'f₀' },
                  { values: f1, color: 'var(--c-alt)', label: 'f₁' },
                ]}
                phi={phi}
                onToggle={s.n <= 60 ? toggle : undefined}
                sim={sim.result?.counts ? sim.result.counts.map((c) => c / sim.result!.B) : null}
                ariaLabel="동전 f₀, f₁과 기각역"
                xTitle={s.n <= 60 ? 'x (막대를 눌러 내 기각역 만들기)' : 'x'}
              />
              <Legend items={[{ color: 'var(--c-null)', label: `f₀: θ=${s.t0}` }, { color: 'var(--c-alt)', label: `f₁: θ=${s.t1}` }, { color: 'var(--c-reject)', label: '기각역', pattern: 'hatch' }]} />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '크기', label: 'E₀[φ(X)]', value: fmtP(size), tone: 'blue', sub: size > s.a + 1e-12 ? 'α 초과 — 수준 α 검정 아님' : undefined },
                  { tag: `θ₁ = ${s.t1}에서`, label: '검정력 E₁[φ(X)]', value: fmtP(power), tone: 'orange', sub: view === 'mine' ? `보조정리 규칙: ${fmtP(npPower)}` : undefined },
                  { tag: '보조정리 규칙', label: '기각 방향', value: sideText },
                  { tag: '경계', label: np.boundary.length ? `x = ${np.boundary.join(', ')}에서 γ` : '확률화 없음', value: np.boundary.length ? fmtNum(np.gamma, 4) : '—' },
                ]}
              />
            </div>
            <div className="math-panels panel">
              <Fold title="이항의 가능도비는 x의 단조함수" open>
                <Tex block>{String.raw`\log\frac{f(x\mid\theta_1)}{f(x\mid\theta_0)}=x\log\frac{\theta_1(1-\theta_0)}{\theta_0(1-\theta_1)}+n\log\frac{1-\theta_1}{1-\theta_0}`}</Tex>
                <p>θ₁ &gt; θ₀이면 x의 계수가 양수이므로 "가능도비가 크다" ⇔ "x가 크다"입니다. 기각역은 X &gt; k (경계 X = k에서 γ) 꼴이고, k와 γ는 θ₁에 의존하지 않습니다 (Karlin–Rubin).</p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: true, t0: true, t1: true, a: true }} t1Label="대립값 θ₁ (움직여 보세요)" />
              <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => update({ n: 20, t0: 0.5, t1: 0.7, a: 0.05, R: '15-20' })}>
                E05 불러오기
              </button>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label="H₀ 아래 반복 판정 (확률화 포함)">
              {sim.result && <SimRate label="기각 비율 → 크기 추정" k={sim.result.rejects} B={sim.result.B} exact={size} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

/* ---------------- 정규 ---------------- */

function NPNormal({ s, update }: Props) {
  const se = stdErr(s.sd, s.n)
  const rule = normalNP(s.t0, s.t1, s.sd, s.n, s.a)
  const power = normalPower(rule, s.t1, s.sd, s.n)
  const c = rule.upper ?? rule.lower!
  const lo = Math.min(s.t0, s.t1) - 4 * se
  const hi = Math.max(s.t0, s.t1) + 4 * se
  return (
    <>
      <StatusBar items={[['모형', `X̄ ~ N(θ, ${s.sd}²/${s.n})`], ['가설', `H₀: θ = ${s.t0}  대  H₁: θ = ${s.t1}`], ['규칙', `R = {x̄ ${rule.upper !== undefined ? '≥' : '≤'} ${fmtNum(c)}}`]]} />
      <LabLayout
        explain={
          <>
            <TextbookBadge>교재 예 7.4 · p.268</TextbookBadge>
            <h2 style={{ marginTop: 10 }}>정규 평균의 최강력검정</h2>
            <p>가능도비가 x̄의 증가함수(θ₁ &gt; θ₀)이므로 기각역은 x̄ ≥ c 꼴이고, c는 α만으로 정해집니다. 연속분포라 확률화가 필요 없습니다.</p>
            <p>θ₁을 움직여도 c는 그대로입니다(UMP). θ₁을 θ₀보다 작게 넘기면 기각역이 왼쪽으로 뒤집힙니다.</p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <ContinuousChart
                domain={[lo, hi]}
                curves={[
                  { fn: (x) => normPdf((x - s.t0) / se) / se, color: 'var(--c-null)', fill: 'var(--c-null-fill)', label: 'H₀' },
                  { fn: (x) => normPdf((x - s.t1) / se) / se, color: 'var(--c-alt)', fill: 'var(--c-alt-fill)', label: 'H₁' },
                ]}
                shades={[rule.upper !== undefined ? { curve: 0, from: c, to: Infinity, kind: 'reject' } : { curve: 0, from: -Infinity, to: c, kind: 'reject' }]}
                vlines={[{ x: c, label: `c = ${fmtNum(c, 3)}`, color: 'var(--c-reject)', dashed: false }]}
                ariaLabel="정규 최강력검정"
                xTitle="x̄"
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '크기', label: 'α (정확히 일치)', value: fmtP(normalPower(rule, s.t0, s.sd, s.n)), tone: 'blue' },
                  { tag: `θ₁ = ${s.t1}에서`, label: '검정력', value: fmtP(power), tone: 'orange' },
                ]}
              />
            </div>
            <div className="math-panels panel">
              <Fold title="풀이 (교재 예 7.4)" open>
                <Tex block>{String.raw`\frac{f(\mathbf x\mid\theta_1)}{f(\mathbf x\mid\theta_0)}=\exp\!\left\{\frac{n(\theta_1-\theta_0)}{\sigma^2}\bar x-\frac{n(\theta_1^2-\theta_0^2)}{2\sigma^2}\right\}`}</Tex>
                <Tex block>{String.raw`R=\left\{\frac{\sqrt n(\bar x-\theta_0)}{\sigma}\ge z_\alpha\right\}\quad(\theta_1>\theta_0)`}</Tex>
              </Fold>
            </div>
          </>
        }
        settings={
          <div className="panel">
            <h3>설정</h3>
            <CommonFields s={s} update={update} show={{ n: true, t0: true, t1: true, sd: true, a: true }} t1Label="대립값 θ₁ (움직여 보세요)" />
          </div>
        }
      />
    </>
  )
}
