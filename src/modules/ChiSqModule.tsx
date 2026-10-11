import { useEffect, useMemo, useState } from 'react'
import { chi2Pdf, chi2PpfUpper, gofExact, gofTest, indepTest, parseCountMatrix, type ChiResult, type IndepResult } from '../engine/chisq'
import { Frac } from '../engine/core/rational'
import { DiscreteChart } from '../components/chart/DiscreteChart'
import { ContinuousChart } from '../components/chart/ContinuousChart'
import { Fold, Legend, StatGrid, Tex, TextbookBadge, type Stat } from '../components/ui'
import { SimPanel, SimRate } from '../components/SimPanel'
import { useSimulation } from '../lib/useSimulation'
import { fmtAlpha, fmtInt, fmtNum, fmtP } from '../lib/format'
import type { LabState } from '../state/labState'
import { CommonFields, LabLayout, StatusBar, ensureSeed, verdict, type Update } from './common'

interface Props {
  s: LabState
  update: Update
}

const GOF_PRESETS = [
  { label: 'Mendel 완두 9:3:3:1', p0: ['9/16', '3/16', '3/16', '1/16'], obs: '315,101,108,32', note: 'Mendel(1866)의 완두 교배 자료로 널리 인용됩니다.' },
  { label: '동전 20번 (K = 2)', p0: ['1/2', '1/2'], obs: '14,6', note: '범주가 2개이면 X² = z²입니다. 이항 정확 검정과 비교해 보세요.' },
  { label: '주사위 60번 (가상)', p0: ['1/6', '1/6', '1/6', '1/6', '1/6', '1/6'], obs: '8,9,12,11,6,14', note: '설명을 위한 가상 자료입니다.' },
  { label: '기대도수가 작은 경우', p0: ['1/5', '1/5', '1/5', '1/5', '1/5'], obs: '1,5,3,2,4', note: '모든 칸의 기대도수가 3입니다. χ² 근사를 시뮬레이션으로 점검하세요.' },
]

const INDEP_PRESETS = [
  { label: '2×3 (가상)', obs: '20,30,25/30,20,25', note: '설명을 위한 가상 자료입니다. X² = 4, 자유도 2.' },
  { label: '2×2 (가상)', obs: '30,10/15,25', note: '설명을 위한 가상 자료입니다. 연속성 보정은 하지 않습니다.' },
  { label: '3×3 성긴 표 (가상)', obs: '2,1,0/1,3,1/0,2,4', note: '기대도수가 작은 칸이 많아 χ² 근사가 의심스러운 예입니다.' },
]

export function ChiSqModule({ s, update }: Props) {
  const isGof = s.model === 'gof'

  const parsed = useMemo(() => {
    const m = parseCountMatrix(s.obs)
    if (!m.ok) return { ok: false as const, error: m.error }
    if (isGof) {
      if (m.rows.length !== 1) return { ok: false as const, error: '적합도 검정의 관측도수는 한 줄로 입력합니다.' }
      const O = m.rows[0]
      if (O.length !== s.p0.length) return { ok: false as const, error: '관측도수와 귀무 확률의 개수가 같아야 합니다.' }
      const fr = s.p0.map((x) => Frac.tryParse(x))
      if (fr.some((f) => !f || f.cmp(Frac.ZERO) <= 0)) return { ok: false as const, error: '귀무 확률은 0보다 큰 소수나 분수여야 합니다.' }
      const sum = Frac.sum(fr as Frac[])
      if (!sum.equals(Frac.ONE)) return { ok: false as const, error: `귀무 확률의 합이 1이어야 합니다 (현재 ${sum.toString()}).` }
      if (O.reduce((a, b) => a + b, 0) === 0) return { ok: false as const, error: '관측도수의 합이 0입니다.' }
      const p0 = (fr as Frac[]).map((f) => f.toNumber())
      return { ok: true as const, res: gofTest(O, p0) as ChiResult, probs: p0, shape: null, indep: null as IndepResult | null }
    }
    if (m.rows.length < 2 || m.rows[0].length < 2) return { ok: false as const, error: '분할표는 2×2 이상이어야 합니다.' }
    const r = indepTest(m.rows)
    if (r.rowSums.some((v) => v === 0) || r.colSums.some((v) => v === 0)) return { ok: false as const, error: '합이 0인 행이나 열이 있습니다.' }
    const probs = m.rows.flatMap((_, i) => r.colSums.map((c) => (r.rowSums[i] * c) / (r.n * r.n)))
    return { ok: true as const, res: r as ChiResult, probs, shape: [m.rows.length, m.rows[0].length] as [number, number], indep: r }
  }, [s.obs, s.p0, isGof])

  const crit = parsed.ok ? chi2PpfUpper(s.a, parsed.res.df) : NaN
  // 적합도는 가능한 결과가 적으면 다항분포를 전수 계산해 정확값을 낸다 (3중 일치)
  const exact = useMemo(() => (parsed.ok && !parsed.shape ? gofExact(parsed.res.n, parsed.probs, s.a, parsed.res.X2) : null), [parsed, s.a])

  const simKey = JSON.stringify(['chi', s.model, s.obs, s.p0, s.a, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    if (!parsed.ok) return
    const seed = ensureSeed(s, update)
    sim.run({ model: 'multinomial', probs: parsed.probs, n: parsed.res.n, B: s.B, seed, shape: parsed.shape, crit }, JSON.stringify(['chi', s.model, s.obs, s.p0, s.a, s.B, seed]))
  }

  const simStats = useMemo(() => {
    const r = sim.result
    if (!r?.values || !parsed.ok) return null
    let geObs = 0
    let gRej = 0
    for (let i = 0; i < r.B; i++) {
      if (r.values[i] >= parsed.res.X2 - 1e-9) geObs++
      if (r.values2 && r.values2[i] > crit) gRej++
    }
    return { geObs, gRej }
  }, [sim.result, parsed, crit])

  const res = parsed.ok ? parsed.res : null
  const df = res?.df ?? 1
  const xMax = res ? Math.max(crit * 1.8, res.X2 * 1.15, res.G * 1.15, df + 4 * Math.sqrt(2 * df)) : 10
  const reject = res ? res.X2 > crit : false

  const stats: Stat[] = res
    ? [
        { tag: '자료의 성질', label: 'Pearson X² = Σ(O−E)²/E', value: fmtNum(res.X2, 3), sub: `χ²(${df}) 근사 p = ${fmtP(res.pX2)}`, tone: 'blue' },
        { tag: '자료의 성질', label: 'G = −2 log Λ = 2ΣO log(O/E)', value: fmtNum(res.G, 3), sub: `χ²(${df}) 근사 p = ${fmtP(res.pG)}` },
        { tag: '규칙의 성질', label: `자유도 · 임계값 (α = ${fmtAlpha(s.a)})`, value: `${df} · ${fmtNum(crit, 3)}`, sub: isGof ? '자유도 = K − 1' : '자유도 = (r − 1)(c − 1)' },
        { tag: '근사 점검', label: '가장 작은 기대도수', value: fmtNum(res.minE, 2), sub: res.smallCells > 0 ? `5 미만인 칸 ${res.smallCells}개 — 시뮬레이션으로 점검하세요` : '모든 칸이 5 이상', tone: res.smallCells > 0 ? 'orange' : undefined },
      ]
    : []

  return (
    <>
      <StatusBar
        items={[
          ['모형', isGof ? `다항분포, 범주 ${s.p0.length}개` : `분할표 ${parsed.ok && parsed.shape ? `${parsed.shape[0]}×${parsed.shape[1]}` : ''}`],
          ['가설', isGof ? 'H₀: (p₁, …, p_K) = 귀무 확률' : 'H₀: 행 변수와 열 변수는 독립'],
          ['n', res ? fmtInt(res.n) : '—'],
          ['α', fmtAlpha(s.a)],
        ]}
      />
      <LabLayout
        explain={
          <>
            <TextbookBadge>교재 7.4 · 식 7.24~7.33 · 예 7.9 · p.279~283</TextbookBadge>
            <h2 style={{ marginTop: 10 }}>{isGof ? '적합도 검정' : '독립성 검정'}</h2>
            {isGof ? (
              <p>
                각 범주의 관측도수 O가 귀무가설의 확률로 계산한 기대도수 E = n·p⁰와 얼마나 다른지 봅니다. K. Pearson(1900)이 처음 제안한 검정입니다.
              </p>
            ) : (
              <p>
                두 범주형 변수가 독립이면 칸 확률은 행 확률 × 열 확률입니다. 기대도수 E = (행합 × 열합)/n과 관측도수를 비교합니다(교재 예 7.9).
              </p>
            )}
            <p>
              <strong>가능도비검정에서 나온다</strong>: 다항분포의 가능도비로 만든 G = −2 log Λ를 테일러 전개하면 Pearson의 X²가 됩니다. 그래서 둘의 값이 비슷하고, 둘 다 근사적으로 χ²분포를 따릅니다(Wilks, 교재 정리 7.2).
            </p>
            <p className="muted">기대도수가 작은 칸이 있으면 χ² 근사가 부정확할 수 있습니다. 시뮬레이션으로 χ² 기각역의 실제 크기를 확인해 보세요.</p>
          </>
        }
        chart={
          <>
            {res && isGof && (
              <div className="panel chart-panel">
                <h3 style={{ margin: '4px 4px 8px' }}>관측도수와 기대도수</h3>
                <DiscreteChart
                  labels={res.Oflat.map((_, i) => `범주 ${i + 1}`)}
                  theory={[
                    { values: res.Eflat, color: 'var(--c-null)', label: '기대도수 E' },
                    { values: res.Oflat, color: 'var(--c-alt)', label: '관측도수 O' },
                  ]}
                  trim={false}
                  ariaLabel={`범주별 관측도수와 기대도수. X² = ${fmtNum(res.X2, 3)}`}
                  xTitle="범주"
                />
                <Legend items={[{ color: 'var(--c-null)', label: '기대도수 E = n·p⁰ (H₀)' }, { color: 'var(--c-alt)', label: '관측도수 O' }]} />
              </div>
            )}
            {res && !isGof && parsed.ok && parsed.indep && <IndepTables r={parsed.indep} />}
            {!parsed.ok && (
              <div className="panel">
                <p className="error-text" role="alert">
                  {parsed.error}
                </p>
              </div>
            )}
            {res && (
              <>
                <div style={{ marginTop: 16 }}>
                  <StatGrid stats={stats} />
                </div>
                <div style={{ marginTop: 12 }}>{verdict(reject)}</div>
                {exact ? (
                  <div className="note blue" style={{ marginTop: 12 }}>
                    <strong>전수 계산 ({fmtInt(exact.outcomes)}가지 결과)</strong>: 정확 p-값 P(X² ≥ {fmtNum(res.X2, 2)}) = {fmtP(exact.pX2)} (χ² 근사 {fmtP(res.pX2)}). 이 n에서 χ² 기각역의 정확한 크기는 X² {fmtP(exact.sizeX2)}, G {fmtP(exact.sizeG)}입니다 (목표 α = {fmtAlpha(s.a)}).
                  </div>
                ) : (
                  <p className="field-hint" style={{ marginTop: 8 }}>
                    가능한 결과가 너무 많아 전수 계산은 생략합니다. χ² 근사의 정확도는 시뮬레이션으로 점검하세요.
                  </p>
                )}
                <div className="panel chart-panel" style={{ marginTop: 16 }}>
                  <h3 style={{ margin: '4px 4px 8px' }}>H₀ 아래 χ²({df}) 분포와 관측값</h3>
                  <ContinuousChart
                    domain={[0, xMax]}
                    curves={[{ fn: (x) => chi2Pdf(x, df), color: 'var(--c-blue)', fill: 'transparent', label: `χ²(${df})` }]}
                    shades={[{ curve: 0, from: crit, to: Infinity, kind: 'reject' }]}
                    vlines={[
                      { x: res.X2, label: `X² = ${fmtNum(res.X2, 2)}` },
                      { x: crit, label: `임계값 ${fmtNum(crit, 2)}`, color: 'var(--c-reject)', dashed: false },
                    ]}
                    hist={sim.result?.values ? { values: sim.result.values, bins: 50 } : null}
                    yMaxHint={df <= 2 ? 0.6 : undefined}
                    ariaLabel={`자유도 ${df}인 카이제곱 밀도와 관측 X² ${fmtNum(res.X2, 2)}`}
                    xTitle="X²"
                  />
                  <Legend
                    items={[
                      { color: 'var(--c-blue)', label: `χ²(${df}) 밀도` },
                      { color: 'var(--c-reject)', label: '기각역', pattern: 'hatch' },
                      ...(sim.result ? [{ color: 'var(--c-sim)', label: 'H₀ 아래 시뮬레이션 X²', pattern: 'fill' as const }] : []),
                    ]}
                  />
                </div>
                <div className="panel" style={{ marginTop: 16 }}>
                  <h3>칸별 기여</h3>
                  <div className="table-scroll" tabIndex={0} role="region" aria-label="표 (넘치면 가로·세로로 스크롤)">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{isGof ? '범주' : '칸 (행, 열)'}</th>
                          <th>O</th>
                          <th>E</th>
                          <th>(O−E)²/E</th>
                          <th>2·O·log(O/E)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {res.Oflat.map((o, i) => {
                          const c = parsed.ok && parsed.shape ? parsed.shape[1] : 1
                          const name = isGof ? `범주 ${i + 1}` : `(${Math.floor(i / c) + 1}, ${(i % c) + 1})`
                          return (
                            <tr key={i} className={res.Eflat[i] < 5 ? 'small-e' : undefined}>
                              <td>{name}</td>
                              <td>{o}</td>
                              <td>{fmtNum(res.Eflat[i], 2)}</td>
                              <td>{fmtNum(res.contrib[i], 4)}</td>
                              <td>{fmtNum(res.gContrib[i], 4)}</td>
                            </tr>
                          )
                        })}
                        <tr>
                          <td>
                            <strong>합</strong>
                          </td>
                          <td>{res.n}</td>
                          <td>{fmtNum(res.n, 2)}</td>
                          <td>
                            <strong>{fmtNum(res.X2, 4)}</strong>
                          </td>
                          <td>
                            <strong>{fmtNum(res.G, 4)}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="field-hint">노란 줄은 기대도수가 5 미만인 칸입니다. G의 칸별 항은 음수일 수 있지만 합은 0 이상입니다.</p>
                </div>
              </>
            )}
            <div className="math-panels panel">
              <Fold title="가능도비검정에서 Pearson χ²로 (교재 식 7.27~7.33)" open>
                <Tex block>{String.raw`-2\log\Lambda=2\sum_{i}O_i\log\frac{O_i}{E_i}=G`}</Tex>
                <p>f(x) = x log(x/E)를 x = E에서 2차까지 전개하면 다음 근사를 얻습니다. ΣO = ΣE이므로 1차 항은 합하면 사라집니다.</p>
                <Tex block>{String.raw`G\approx\sum_i\frac{(O_i-E_i)^2}{E_i}=X^2`}</Tex>
                <Tex block>{String.raw`X^2\ \dot\sim\ \chi^2_r,\qquad r=(\text{전체에서 추정하는 모수 수})-(\text{H}_0\text{에서 추정하는 모수 수})`}</Tex>
                <p>
                  {isGof ? (
                    <>적합도: 전체에서는 K − 1개(확률의 합이 1), H₀에서는 0개를 추정하므로 r = K − 1입니다. 귀무가설이 모수를 추정해야 하는 형태라면 그 수만큼 더 뺍니다.</>
                  ) : (
                    <>독립성: 전체에서는 rc − 1개, H₀에서는 (r − 1) + (c − 1)개를 추정하므로 자유도는 (r − 1)(c − 1)입니다(교재 예 7.9).</>
                  )}
                </p>
              </Fold>
              {isGof && (
                <Fold title="범주가 2개이면 X² = z²">
                  <p>K = 2이면 O₁ = x, O₂ = n − x, E = n p₀, n(1 − p₀)이고 다음이 성립합니다. 동전 모형의 정규 근사 양측 검정과 같은 검정입니다.</p>
                  <Tex block>{String.raw`X^2=\frac{(x-np_0)^2}{np_0}+\frac{(x-np_0)^2}{n(1-p_0)}=\frac{(x-np_0)^2}{np_0(1-p_0)}=z^2`}</Tex>
                </Fold>
              )}
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ a: true }} />
            </div>
            {isGof ? <GofEditor s={s} update={update} /> : <IndepEditor s={s} update={update} />}
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label="H₀ 아래 다항 표본 반복">
              {sim.result && res && simStats && (
                <>
                  {exact ? (
                    <>
                      <SimRate label="X² 기각역의 실제 크기" k={sim.result.rejects} B={sim.result.B} exact={exact.sizeX2} refLabel="정확한 크기" />
                      <SimRate label="G 기각역의 실제 크기" k={simStats.gRej} B={sim.result.B} exact={exact.sizeG} refLabel="정확한 크기" />
                    </>
                  ) : (
                    <>
                      <SimRate label="X² 기각역의 실제 크기" k={sim.result.rejects} B={sim.result.B} exact={s.a} refLabel="목표 α" outsideMsg="— 구간 밖: 이 n에서는 χ² 근사가 맞지 않습니다" />
                      <SimRate label="G 기각역의 실제 크기" k={simStats.gRej} B={sim.result.B} exact={s.a} refLabel="목표 α" outsideMsg="— 구간 밖: 이 n에서는 χ² 근사가 맞지 않습니다" />
                    </>
                  )}
                  <div style={{ fontSize: '0.82rem', marginTop: 8 }}>
                    <strong>몬테카를로 p-값</strong>: P(X² ≥ {fmtNum(res.X2, 2)}) ≈ {fmtP((simStats.geObs + 1) / (sim.result.B + 1))}
                    <div className="field-hint">
                      χ² 근사 p = {fmtP(res.pX2)}{exact ? `, 정확 p = ${fmtP(exact.pX2)}` : ''}와 비교하세요. {isGof ? '' : '분할표는 관측한 주변합으로 추정한 독립 모형에서 표본을 뽑습니다.'}
                    </div>
                  </div>
                </>
              )}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

function IndepTables({ r }: { r: IndepResult }) {
  const R = r.E.length
  const C = r.E[0].length
  const maxC = Math.max(...r.contrib, 1e-9)
  return (
    <div className="panel">
      <h3>관측도수 (괄호: 기대도수)</h3>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="표 (넘치면 가로·세로로 스크롤)">
        <table className="data-table contingency">
          <thead>
            <tr>
              <th />
              {Array.from({ length: C }, (_, j) => (
                <th key={j}>열 {j + 1}</th>
              ))}
              <th>행합</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: R }, (_, i) => (
              <tr key={i}>
                <td>행 {i + 1}</td>
                {Array.from({ length: C }, (_, j) => {
                  const k = i * C + j
                  const o = r.Oflat[k]
                  const e = r.Eflat[k]
                  const w = r.contrib[k] / maxC
                  const bg = o >= e ? `rgba(194, 65, 12, ${0.06 + 0.22 * w})` : `rgba(0, 102, 204, ${0.06 + 0.22 * w})`
                  return (
                    <td key={j} style={{ background: bg }} title={`(O−E)²/E = ${fmtNum(r.contrib[k], 3)}`}>
                      <strong>{o}</strong> <span style={{ color: 'var(--c-text-secondary)', fontSize: '0.74rem' }}>({fmtNum(e, 1)})</span>
                    </td>
                  )
                })}
                <td>{r.rowSums[i]}</td>
              </tr>
            ))}
            <tr>
              <td>열합</td>
              {r.colSums.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
              <td>{r.n}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="field-hint">색이 진할수록 그 칸의 (O−E)²/E가 큽니다. 주황은 기대보다 많음, 파랑은 기대보다 적음.</p>
    </div>
  )
}

function GofEditor({ s, update }: Props) {
  const parsedO = s.obs.split(',')
  const [p0, setP0] = useState(s.p0)
  const [obs, setObs] = useState(parsedO)
  useEffect(() => {
    setP0(s.p0)
    setObs(s.obs.split(','))
  }, [s.p0, s.obs])
  const commit = (a = p0, b = obs) => update({ p0: a, obs: b.map((v) => v.trim()).join(','), seed: s.seed })
  const K = p0.length
  return (
    <div className="panel">
      <h3>범주별 귀무 확률과 관측도수</h3>
      <div className="row" style={{ marginBottom: 10 }}>
        {GOF_PRESETS.map((p) => (
          <button key={p.label} className="btn-outline sm" onClick={() => update({ p0: p.p0, obs: p.obs })} title={p.note}>
            {p.label}
          </button>
        ))}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>범주</th>
            <th>p⁰</th>
            <th>O</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: K }, (_, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>
                <input className="num-input" style={{ minHeight: 32, padding: '4px 8px', textAlign: 'right' }} value={p0[i] ?? ''} aria-label={`범주 ${i + 1} 귀무 확률`} onChange={(e) => setP0(p0.map((v, j) => (j === i ? e.target.value : v)))} onBlur={() => commit()} onKeyDown={(e) => e.key === 'Enter' && commit()} />
              </td>
              <td>
                <input className="num-input" style={{ minHeight: 32, padding: '4px 8px', textAlign: 'right' }} inputMode="numeric" value={obs[i] ?? ''} aria-label={`범주 ${i + 1} 관측도수`} onChange={(e) => setObs(obs.map((v, j) => (j === i ? e.target.value : v)))} onBlur={() => commit()} onKeyDown={(e) => e.key === 'Enter' && commit()} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn-ghost" disabled={K >= 8} onClick={() => commit([...p0, '0'], [...obs, '0'])}>
          ＋ 범주 추가
        </button>
        <button className="btn-ghost" disabled={K <= 2} onClick={() => commit(p0.slice(0, -1), obs.slice(0, -1))}>
          － 마지막 범주 삭제
        </button>
      </div>
      <p className="field-hint">귀무 확률은 소수나 분수(9/16)로, 합이 정확히 1이 되게 입력합니다. 범주는 2~8개입니다.</p>
    </div>
  )
}

function IndepEditor({ s, update }: Props) {
  const toGrid = (str: string) => str.split('/').map((r) => r.split(','))
  const [grid, setGrid] = useState(toGrid(s.obs))
  useEffect(() => {
    setGrid(toGrid(s.obs))
  }, [s.obs])
  const commit = (g = grid) => update({ obs: g.map((r) => r.map((v) => v.trim()).join(',')).join('/') })
  const R = grid.length
  const C = grid[0]?.length ?? 0
  return (
    <div className="panel">
      <h3>분할표 관측도수</h3>
      <div className="row" style={{ marginBottom: 10 }}>
        {INDEP_PRESETS.map((p) => (
          <button key={p.label} className="btn-outline sm" onClick={() => update({ obs: p.obs })} title={p.note}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="표 (넘치면 가로·세로로 스크롤)">
        <table className="data-table">
          <tbody>
            {grid.map((row, i) => (
              <tr key={i}>
                <td>행 {i + 1}</td>
                {row.map((v, j) => (
                  <td key={j}>
                    <input
                      className="num-input"
                      style={{ minHeight: 32, padding: '4px 6px', textAlign: 'right', minWidth: 48 }}
                      inputMode="numeric"
                      value={v}
                      aria-label={`행 ${i + 1} 열 ${j + 1} 도수`}
                      onChange={(e) => setGrid(grid.map((r, a) => (a === i ? r.map((x, b) => (b === j ? e.target.value : x)) : r)))}
                      onBlur={() => commit()}
                      onKeyDown={(e) => e.key === 'Enter' && commit()}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn-ghost" disabled={R >= 5} onClick={() => commit([...grid, grid[0].map(() => '0')])}>
          ＋ 행
        </button>
        <button className="btn-ghost" disabled={R <= 2} onClick={() => commit(grid.slice(0, -1))}>
          － 행
        </button>
        <button className="btn-ghost" disabled={C >= 5} onClick={() => commit(grid.map((r) => [...r, '0']))}>
          ＋ 열
        </button>
        <button className="btn-ghost" disabled={C <= 2} onClick={() => commit(grid.map((r) => r.slice(0, -1)))}>
          － 열
        </button>
      </div>
      <p className="field-hint">2×2부터 5×5까지. 도수는 0 이상의 정수입니다.</p>
    </div>
  )
}
