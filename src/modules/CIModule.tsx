import { useMemo, useState } from 'react'
import { CI_METHODS, coinAcceptance, coinCI, coinCoverage, coinPFunction, normalCI, normalPFunction, type CIMethod } from '../engine/ci'
import { normPpf } from '../engine/core/normal'
import { Rng, deriveSeed } from '../engine/core/rng'
import { stdErr } from '../engine/normal'
import { BeltChart } from '../components/chart/BeltChart'
import { LineChart } from '../components/chart/LineChart'
import { LadderChart } from '../components/chart/LadderChart'
import { Fold, Legend, SliderField, StatGrid, Tex, TextbookBadge } from '../components/ui'
import { SimPanel, SimRate } from '../components/SimPanel'
import { useSimulation } from '../lib/useSimulation'
import { fmtAlpha, fmtNum, fmtP } from '../lib/format'
import type { LabState } from '../state/labState'
import { CommonFields, LabLayout, StatusBar, ensureSeed, type Update } from './common'

interface Props {
  s: LabState
  update: Update
}

const fmtB = (v: number) => (v === Infinity ? '∞' : v === -Infinity ? '−∞' : fmtNum(v, 4))
const LADDER_N = 40

export function CIModule({ s, update }: Props) {
  return s.model === 'normal' ? <CINormal s={s} update={update} /> : <CICoin s={s} update={update} />
}

function Explain() {
  return (
    <>
      <TextbookBadge>교재 8.7 · 식 8.54~8.61 · p.322~324</TextbookBadge>
      <h2 style={{ marginTop: 10 }}>신뢰구간 = 기각하지 못하는 θ₀의 모임</h2>
      <p>
        유의수준 α 검정 H₀: θ = θ₀의 <strong>수용역</strong>을 A(θ₀)라 하면, 관측값 x에 대해 다음이 성립합니다.
      </p>
      <Tex block>{String.raw`\theta_0\in C(x)\iff x\in A(\theta_0)`}</Tex>
      <p>그림(신뢰띠)을 세로로 자르면 수용역, 가로로 자르면 신뢰구간입니다. θ₀ 슬라이더를 움직여 두 판정이 언제나 같은 것을 확인해 보세요.</p>
      <div className="note">
        <strong>워크북 2018 기말 25번 유형</strong>: θ의 95% 신뢰구간이 [0, 7]이면, 유의수준 0.05에서 H₀: θ = θ₀를 기각하는 값은 구간 밖의 θ₀입니다(예: 9). 1, 5, 6은 기각하지 못합니다.
      </div>
    </>
  )
}

/* ---------------- 동전 ---------------- */

function CICoin({ s, update }: Props) {
  const [method, setMethod] = useState<CIMethod>('cp')
  const n = s.n
  const x = Math.min(s.x, n)
  const meta = CI_METHODS.find((m) => m.id === method)!

  const cis = useMemo(() => {
    const out = {} as Record<CIMethod, [number, number][]>
    for (const m of CI_METHODS) out[m.id] = Array.from({ length: n + 1 }, (_, k) => coinCI(k, n, s.a, m.id))
    return out
  }, [n, s.a])
  const ci = cis[method][x]
  const p0 = coinPFunction(x, n, s.t0, method)
  const inCI = ci[0] < s.t0 && s.t0 < ci[1]
  const notRejected = p0 > s.a

  const grid = useMemo(() => Array.from({ length: 401 }, (_, i) => i / 400), [])
  const pCurves = useMemo(
    () => CI_METHODS.map((m) => ({ pts: grid.map((t) => [t, coinPFunction(x, n, t, m.id)] as [number, number]), color: m.color, label: m.label, dashed: m.id !== method })),
    [grid, x, n, method],
  )
  const covGrid = useMemo(() => Array.from({ length: 199 }, (_, i) => (i + 1) / 200), [])
  const covCurves = useMemo(
    () => CI_METHODS.map((m) => ({ pts: covGrid.map((t) => [t, coinCoverage(n, t, s.a, m.id, cis[m.id])] as [number, number]), color: m.color, label: m.label, dashed: m.id !== method })),
    [covGrid, n, s.a, cis, method],
  )
  const coverTs = CI_METHODS.map((m) => coinCoverage(n, s.ts, s.a, m.id, cis[m.id]))
  const accept = coinAcceptance(n, s.t0, s.a, method)

  // 반복 표본: x마다 θ*를 덮는지가 정해지므로 동전 시뮬레이션의 φ로 그대로 쓴다
  const coverPhi = cis[method].map(([lo, hi]) => (lo <= s.ts && s.ts <= hi ? 1 : 0))
  const simKey = JSON.stringify(['ci-c', n, s.ts, s.a, method, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    sim.run({ model: 'coin', n, theta: s.ts, B: s.B, seed, phi: coverPhi }, JSON.stringify(['ci-c', n, s.ts, s.a, method, s.B, seed]))
  }
  const ladder = useMemo(() => {
    if (s.seed === null || !sim.result) return null
    const rng = new Rng(deriveSeed(s.seed, 77))
    return Array.from({ length: LADDER_N }, () => {
      let k = 0
      for (let i = 0; i < n; i++) if (rng.next() < s.ts) k++
      const [lo, hi] = cis[method][k]
      return { lo, hi, covers: lo <= s.ts && s.ts <= hi }
    })
  }, [s.seed, sim.result, n, s.ts, cis, method])

  return (
    <>
      <StatusBar items={[['모형', `X ~ B(${n}, θ)`], ['관측', `x = ${x}, θ̂ = ${fmtNum(x / n, 3)}`], ['신뢰수준', `${fmtNum((1 - s.a) * 100, 1)}%`], ['구간', meta.label]]} />
      <LabLayout
        explain={<Explain />}
        chart={
          <>
            <div className="panel chart-panel">
              <div className="tab-nav" role="radiogroup" aria-label="구간 방법" style={{ margin: '4px 4px 10px' }}>
                {CI_METHODS.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={method === m.id} className={`tab-btn${method === m.id ? ' active' : ''}`} onClick={() => setMethod(m.id)}>
                    {m.label}
                  </button>
                ))}
              </div>
              <BeltChart
                xDomain={[0, 1]}
                yDomain={[-0.5, n + 0.5]}
                bars={cis[method].map(([lo, hi], k) => ({ y: k, lo, hi }))}
                observedY={x}
                theta0={s.t0}
                ci={ci}
                accept={accept}
                xTitle="가설값 θ₀"
                yTitle="관측값 x"
                ariaLabel={`${meta.label} 신뢰띠. x = ${x}의 신뢰구간 [${fmtNum(ci[0], 3)}, ${fmtNum(ci[1], 3)}]`}
              />
              <Legend
                items={[
                  { color: 'var(--c-null)', label: '신뢰띠 (x마다 신뢰구간)' },
                  { color: 'var(--c-obs)', label: '관측 x의 신뢰구간 (가로)', pattern: 'line' },
                  { color: 'var(--c-alt)', label: 'θ₀의 수용역 (세로 점)', pattern: 'fill' },
                ]}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '자료의 성질', label: `${fmtNum((1 - s.a) * 100, 0)}% 신뢰구간`, value: `[${fmtB(Math.max(0, ci[0]))}, ${fmtB(Math.min(1, ci[1]))}]`, sub: method === 'wald' && (ci[0] < 0 || ci[1] > 1) ? `계산값 [${fmtB(ci[0])}, ${fmtB(ci[1])}]이 [0, 1]을 벗어남` : `길이 ${fmtNum(Math.min(1, ci[1]) - Math.max(0, ci[0]), 4)}`, tone: 'blue' },
                  { tag: '검정', label: `H₀: θ = ${s.t0}의 p-값`, value: fmtP(p0), sub: notRejected ? 'α보다 큼 → 기각하지 못함' : 'α 이하 → 기각', tone: 'orange' },
                ]}
              />
            </div>
            <div className={`verdict ${inCI === notRejected ? 'keep' : 'reject'}`} style={{ marginTop: 12 }}>
              θ₀ = {s.t0}는 신뢰구간 {inCI ? '안' : '밖'}에 있고, 검정은 H₀를 {notRejected ? '기각하지 못합니다' : '기각합니다'}. {inCI === notRejected ? '두 판정이 일치합니다 (쌍대성).' : '경계값입니다.'}
            </div>
            <div className="panel chart-panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '4px 4px 8px' }}>p-값 함수: θ₀마다 검정한 결과</h3>
              <LineChart
                xDomain={[0, 1]}
                series={pCurves}
                band={{ from: Math.max(0, ci[0]), to: Math.min(1, ci[1]), label: '신뢰구간 = {θ₀ : p(θ₀) > α}' }}
                hlines={[{ y: s.a, label: `α = ${fmtAlpha(s.a)}`, color: 'var(--c-reject)' }]}
                vlines={[{ x: s.t0, label: 'θ₀', color: 'var(--c-alt)' }]}
                markers={[{ x: s.t0, y: p0, color: meta.color }]}
                xTitle="가설값 θ₀"
                yTitle="p-값"
                ariaLabel="가설값에 따른 p-값 함수. α 위에 있는 θ₀들이 신뢰구간"
              />
              <Legend items={pCurves.map((c) => ({ color: c.color, label: c.label, pattern: c.dashed ? ('line' as const) : undefined }))} />
            </div>
            <div className="panel" style={{ marginTop: 16 }}>
              <h3>세 구간과 각 구간이 뒤집는 검정</h3>
              <div className="table-scroll" tabIndex={0} role="region" aria-label="표 (넘치면 가로·세로로 스크롤)" style={{ maxHeight: 'none' }}>
                <table className="data-table compare-table">
                  <thead>
                    <tr>
                      <th>구간</th>
                      <th>x = {x}의 구간</th>
                      <th>뒤집는 검정</th>
                      <th>θ* = {s.ts}에서 포함확률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CI_METHODS.map((m, i) => (
                      <tr key={m.id} className={m.id === method ? 'in-r' : undefined}>
                        <td>{m.label}</td>
                        <td>
                          [{fmtNum(cis[m.id][x][0], 4)}, {fmtNum(cis[m.id][x][1], 4)}]
                        </td>
                        <td>{m.test}</td>
                        <td>{fmtP(coverTs[i])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="panel chart-panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '4px 4px 8px' }}>정확한 포함확률 P(θ* ∈ C(X)) — 참값 θ*에 따라</h3>
              <LineChart
                xDomain={[0, 1]}
                yDomain={[0.7, 1]}
                series={covCurves}
                hlines={[{ y: 1 - s.a, label: `1 − α = ${fmtNum(1 - s.a, 3)}`, color: 'var(--c-reject)' }]}
                vlines={[{ x: s.ts, label: 'θ*', color: 'var(--c-alt)' }]}
                xTitle="참값 θ*"
                yTitle="포함확률"
                ariaLabel="참값에 따른 세 신뢰구간의 정확한 포함확률"
              />
              <p className="field-hint" style={{ margin: '0 4px 8px' }}>
                Clopper–Pearson은 늘 1 − α 이상(보수적)이고, Wald는 θ*가 0이나 1에 가까우면 크게 모자랍니다. 이산분포라 곡선이 톱니 모양입니다.
              </p>
            </div>
            {ladder && (
              <div className="panel chart-panel" style={{ marginTop: 16 }}>
                <h3 style={{ margin: '4px 4px 8px' }}>반복 표본 {LADDER_N}개의 신뢰구간</h3>
                <LadderChart intervals={ladder} truth={s.ts} yDomain={[0, 1]} ariaLabel={`${LADDER_N}개 구간 중 ${ladder.filter((l) => l.covers).length}개가 참값을 포함`} />
                <p className="field-hint" style={{ margin: '0 4px 8px' }}>
                  {LADDER_N}개 중 {ladder.filter((l) => l.covers).length}개가 참값을 덮었습니다. "이 구간이 θ를 포함할 확률이 95%"가 아니라, "이 방법으로 만든 구간들 중 약 95%가 θ를 포함한다"는 뜻입니다.
                </p>
              </div>
            )}
            <div className="math-panels panel">
              <Fold title="쌍대성 (교재 식 8.59~8.61)" open>
                <Tex block>{String.raw`P_{\theta_0}\big(X\in A(\theta_0)\big)\ge 1-\alpha\ \ \forall\theta_0\quad\Longrightarrow\quad P_{\theta}\big(\theta\in C(X)\big)\ge 1-\alpha\ \ \forall\theta`}</Tex>
                <p>θ ∈ C(X) ⇔ X ∈ A(θ)이므로 두 확률은 같은 사건의 확률입니다. 검정의 크기가 α 이하이면 구간의 포함확률은 1 − α 이상입니다. 이산분포에서 "이상"인 이유도 검정의 크기가 α보다 작을 수 있기 때문입니다.</p>
              </Fold>
              <Fold title="Clopper–Pearson 구간">
                <p>양 꼬리 각 α/2의 이항 정확 검정을 뒤집습니다. 하한 L과 상한 U는 다음 식의 해입니다(베타분포 분위수와 같음).</p>
                <Tex block>{String.raw`P_{L}(X\ge x)=\tfrac{\alpha}{2},\qquad P_{U}(X\le x)=\tfrac{\alpha}{2}`}</Tex>
              </Fold>
              <Fold title="Wald 구간 (교재 정리 8.8)과 Wilson 구간">
                <Tex block>{String.raw`\text{Wald: }\hat p\pm z_{\alpha/2}\sqrt{\hat p(1-\hat p)/n},\qquad \text{Wilson: }\left\{\theta_0:\ \frac{|x-n\theta_0|}{\sqrt{n\theta_0(1-\theta_0)}}<z_{\alpha/2}\right\}`}</Tex>
                <p>둘 다 정규 근사지만, Wald는 분산에 θ̂를, Wilson은 θ₀를 씁니다. Wilson이 뒤집는 검정은 χ²검정(범주 2개)과 같습니다. x = 0이면 Wald 구간은 [0, 0]으로 퇴화합니다.</p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: true, a: true }} />
              <div style={{ marginTop: 16 }}>
                <SliderField label="관측값 x" value={x} min={0} max={n} step={1} onChange={(v) => update({ x: v })} />
              </div>
              <div style={{ marginTop: 16 }}>
                <SliderField label="검정할 가설값 θ₀" value={s.t0} min={0.01} max={0.99} step={0.01} onChange={(v) => update({ t0: v })} hint="세로선을 움직이며 수용역과 신뢰구간을 비교합니다." />
              </div>
              <div style={{ marginTop: 16 }}>
                <SliderField label="참값 θ* (포함확률·시뮬레이션)" value={s.ts} min={0.01} max={0.99} step={0.01} onChange={(v) => update({ ts: v })} />
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn-ghost" onClick={() => update({ n: 400, x: 280, a: 0.05, t0: 0.65, ts: 0.7 })}>
                  교재 예 8.8 (n = 400)
                </button>
                <button className="btn-ghost" onClick={() => update({ n: 20, x: 0, a: 0.05, t0: 0.05, ts: 0.05 })}>
                  x = 0인 경우
                </button>
              </div>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label={`θ* = ${s.ts}에서 반복 표본`}>
              {sim.result && <SimRate label="참값을 포함한 비율" k={sim.result.rejects} B={sim.result.B} exact={coverTs[CI_METHODS.findIndex((m) => m.id === method)]} refLabel="정확한 포함확률" />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}

/* ---------------- 정규 ---------------- */

function CINormal({ s, update }: Props) {
  const se = stdErr(s.sd, s.n)
  const ci = normalCI(s.x, s.sd, s.n, s.a, s.dir)
  const p0 = normalPFunction(s.x, s.sd, s.n, s.t0, s.dir)
  const inCI = ci[0] < s.t0 && s.t0 < ci[1]
  const notRejected = p0 > s.a
  const zTwo = normPpf(1 - s.a / 2)
  const zOne = normPpf(1 - s.a)
  // 수용역 A(θ₀) (x̄ 척도)
  const accLower = (t: number) => (s.dir === 'two' ? t - zTwo * se : s.dir === 'R' ? -Infinity : t - zOne * se)
  const accUpper = (t: number) => (s.dir === 'two' ? t + zTwo * se : s.dir === 'R' ? t + zOne * se : Infinity)
  const span = 4.5 * se + Math.abs(s.x - s.t0)
  const center = (s.x + s.t0) / 2
  const dom: [number, number] = [center - span, center + span]
  const grid = Array.from({ length: 301 }, (_, i) => dom[0] + ((dom[1] - dom[0]) * i) / 300)
  const pCurve = grid.map((t) => [t, normalPFunction(s.x, s.sd, s.n, t, s.dir)] as [number, number])

  const rule = s.dir === 'two' ? { upper: s.ts + zTwo * se, lower: s.ts - zTwo * se } : s.dir === 'R' ? { upper: s.ts + zOne * se } : { lower: s.ts - zOne * se }
  const simKey = JSON.stringify(['ci-n', s.n, s.sd, s.ts, s.a, s.dir, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    sim.run({ model: 'normal', n: s.n, theta: s.ts, sigma: s.sd, B: s.B, seed, rule }, JSON.stringify(['ci-n', s.n, s.sd, s.ts, s.a, s.dir, s.B, seed]))
  }
  const ladder = useMemo(() => {
    if (s.seed === null || !sim.result) return null
    const rng = new Rng(deriveSeed(s.seed, 77))
    return Array.from({ length: LADDER_N }, () => {
      let sum = 0
      for (let i = 0; i < s.n; i++) sum += s.ts + s.sd * rng.normal()
      const [lo, hi] = normalCI(sum / s.n, s.sd, s.n, s.a, s.dir)
      return { lo, hi, covers: lo <= s.ts && s.ts <= hi }
    })
  }, [s.seed, sim.result, s.n, s.ts, s.sd, s.a, s.dir])

  const ciText = `[${fmtB(ci[0])}, ${fmtB(ci[1])}]`
  return (
    <>
      <StatusBar items={[['모형', `X̄ ~ N(θ, ${s.sd}²/${s.n})`], ['관측', `x̄ = ${fmtNum(s.x)}`], ['신뢰수준', `${fmtNum((1 - s.a) * 100, 1)}%`], ['검정 방향', s.dir === 'two' ? '양측 → 양쪽 구간' : s.dir === 'R' ? '우측 → 하한만 있는 구간' : '좌측 → 상한만 있는 구간']]} />
      <LabLayout
        explain={<Explain />}
        chart={
          <>
            <div className="panel chart-panel">
              <BeltChart
                xDomain={dom}
                yDomain={dom}
                band={{ lower: accLower, upper: accUpper }}
                observedY={s.x}
                theta0={s.t0}
                ci={ci}
                accept={[accLower(s.t0), accUpper(s.t0)]}
                xTitle="가설값 θ₀"
                yTitle="관측 x̄"
                ariaLabel={`정규 평균 신뢰띠. 신뢰구간 ${ciText}`}
              />
              <Legend items={[{ color: 'var(--c-null)', label: '신뢰띠 (θ₀마다 수용역)' }, { color: 'var(--c-obs)', label: '관측 x̄의 신뢰구간', pattern: 'line' }, { color: 'var(--c-alt)', label: 'θ₀의 수용역', pattern: 'fill' }]} />
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '자료의 성질', label: `${fmtNum((1 - s.a) * 100, 0)}% 신뢰구간`, value: ciText, tone: 'blue', sub: s.dir === 'two' ? `x̄ ± ${fmtNum(zTwo, 3)} · σ/√n` : '단측 검정을 뒤집은 한쪽 구간' },
                  { tag: '검정', label: `H₀: θ = ${s.t0}의 p-값`, value: fmtP(p0), sub: notRejected ? '기각하지 못함' : '기각', tone: 'orange' },
                ]}
              />
            </div>
            <div className={`verdict ${inCI === notRejected ? 'keep' : 'reject'}`} style={{ marginTop: 12 }}>
              θ₀ = {s.t0}는 신뢰구간 {inCI ? '안' : '밖'}에 있고, 검정은 H₀를 {notRejected ? '기각하지 못합니다' : '기각합니다'}. {inCI === notRejected ? '두 판정이 일치합니다 (쌍대성).' : '경계값입니다.'}
            </div>
            <div className="panel chart-panel" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '4px 4px 8px' }}>p-값 함수</h3>
              <LineChart
                xDomain={dom}
                series={[{ pts: pCurve, color: 'var(--c-blue)', label: 'p(θ₀)' }]}
                band={{ from: Math.max(dom[0], ci[0]), to: Math.min(dom[1], ci[1]), label: '신뢰구간' }}
                hlines={[{ y: s.a, label: `α = ${fmtAlpha(s.a)}`, color: 'var(--c-reject)' }]}
                vlines={[{ x: s.t0, label: 'θ₀', color: 'var(--c-alt)' }]}
                markers={[{ x: s.t0, y: p0, color: 'var(--c-blue)' }]}
                xTitle="가설값 θ₀"
                yTitle="p-값"
                ariaLabel="정규 평균의 p-값 함수"
              />
            </div>
            {ladder && (
              <div className="panel chart-panel" style={{ marginTop: 16 }}>
                <h3 style={{ margin: '4px 4px 8px' }}>반복 표본 {LADDER_N}개의 신뢰구간</h3>
                <LadderChart intervals={ladder} truth={s.ts} yDomain={[s.ts - 4 * se, s.ts + 4 * se]} ariaLabel={`${LADDER_N}개 구간 중 ${ladder.filter((l) => l.covers).length}개가 참값을 포함`} />
                <p className="field-hint" style={{ margin: '0 4px 8px' }}>
                  {LADDER_N}개 중 {ladder.filter((l) => l.covers).length}개가 참값을 덮었습니다. 구간은 표본마다 바뀌고 참값은 고정되어 있습니다.
                </p>
              </div>
            )}
            <div className="math-panels panel">
              <Fold title="교재 8.7의 유도" open>
                <Tex block>{String.raw`\left|\frac{\bar x-\theta_0}{\sigma/\sqrt n}\right|\le z_{\alpha/2}\iff \bar x-z_{\alpha/2}\frac{\sigma}{\sqrt n}\le\theta_0\le\bar x+z_{\alpha/2}\frac{\sigma}{\sqrt n}`}</Tex>
                <p>왼쪽은 "H₀: θ = θ₀를 기각하지 못한다", 오른쪽은 "θ₀가 신뢰구간 안에 있다"입니다(교재 식 8.56~8.58). 연속분포라 포함확률은 정확히 1 − α입니다.</p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: true, sd: true, a: true, dir: ['two', 'R', 'L'] }} />
              <div style={{ marginTop: 16 }}>
                <SliderField label="관측 x̄" value={s.x} min={-5} max={5} step={0.01} onChange={(v) => update({ x: v })} />
              </div>
              <div style={{ marginTop: 16 }}>
                <SliderField label="검정할 가설값 θ₀" value={s.t0} min={-5} max={5} step={0.01} onChange={(v) => update({ t0: v })} />
              </div>
              <div style={{ marginTop: 16 }}>
                <SliderField label="참값 θ* (시뮬레이션)" value={s.ts} min={-5} max={5} step={0.05} onChange={(v) => update({ ts: v })} />
              </div>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label={`θ* = ${s.ts}에서 반복 표본`}>
              {sim.result && <SimRate label="참값을 포함한 비율" k={sim.result.B - sim.result.rejects} B={sim.result.B} exact={1 - s.a} refLabel="정확한 포함확률" />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}
