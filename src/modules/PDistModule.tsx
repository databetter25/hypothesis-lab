import { useMemo } from 'react'
import { coinAutoRule, coinLrtRule, coinPmf, coinPValue } from '../engine/coin'
import { pValueDistribution } from '../engine/discrete'
import { normalAutoRule, normalPower, normalPValue, normalPValueCdf } from '../engine/normal'
import { LineChart } from '../components/chart/LineChart'
import { ContinuousChart } from '../components/chart/ContinuousChart'
import { Fold, Legend, StatGrid, Tex, TextbookBadge } from '../components/ui'
import { SimPanel, SimRate } from '../components/SimPanel'
import { useSimulation } from '../lib/useSimulation'
import { fmtAlpha, fmtP } from '../lib/format'
import type { LabState } from '../state/labState'
import { CommonFields, LabLayout, StatusBar, ensureSeed, type Update } from './common'

interface Props {
  s: LabState
  update: Update
}

function stepCdf(entries: { value: number; prob: number }[]): [number, number][] {
  const pts: [number, number][] = [[0, 0]]
  let acc = 0
  for (const e of entries) {
    pts.push([e.value, acc])
    acc += e.prob
    pts.push([e.value, Math.min(1, acc)])
  }
  pts.push([1, Math.min(1, acc)])
  return pts
}

export function PDistModule({ s, update }: Props) {
  const isNormal = s.model === 'normal'
  const dir = s.dir

  const calc = useMemo(() => {
    if (isNormal) {
      const grid = Array.from({ length: 201 }, (_, i) => i / 200)
      const cdf = grid.map((u) => [u, normalPValueCdf(u, s.t0, s.ts, s.sd, s.n, dir)] as [number, number])
      const rule = normalAutoRule(s.t0, s.sd, s.n, s.a, dir)
      return { cdf, pAtAlpha: normalPower(rule, s.ts, s.sd, s.n), pv: null as number[] | null, rule, phi: null as Float64Array | null }
    }
    const pdir = dir === 'two' ? 'two-lrt' : dir
    const pv = Array.from({ length: s.n + 1 }, (_, x) => coinPValue(s.n, s.t0, x, pdir))
    const dist = pValueDistribution(pv, coinPmf(s.n, s.ts))
    const phi = dir === 'two' ? coinLrtRule(s.n, s.t0, s.a).phi : coinAutoRule(s.n, s.t0, s.a, dir).phi
    const pAtAlpha = dist.filter((e) => e.value <= s.a).reduce((a, e) => a + e.prob, 0)
    return { cdf: stepCdf(dist), pAtAlpha, pv, rule: null, phi }
  }, [isNormal, s.n, s.t0, s.ts, s.sd, s.a, dir])

  const simKey = JSON.stringify(['pd', s.model, s.n, s.t0, s.ts, s.sd, s.a, dir, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    const key = JSON.stringify(['pd', s.model, s.n, s.t0, s.ts, s.sd, s.a, dir, s.B, seed])
    if (isNormal && calc.rule) sim.run({ model: 'normal', n: s.n, theta: s.ts, sigma: s.sd, B: s.B, seed, rule: calc.rule }, key)
    else if (calc.phi) sim.run({ model: 'coin', n: s.n, theta: s.ts, B: s.B, seed, phi: [...calc.phi] }, key)
  }

  const simP = useMemo(() => {
    const r = sim.result
    if (!r) return null
    if (r.values) return Float64Array.from(r.values, (xb) => normalPValue(xb, s.t0, s.sd, s.n, dir))
    if (r.counts && calc.pv) {
      const out = new Float64Array(r.B)
      let k = 0
      r.counts.forEach((c, x) => {
        for (let j = 0; j < c; j++) out[k++] = calc.pv![x]
      })
      return out
    }
    return null
  }, [sim.result, calc.pv, s.t0, s.sd, s.n, dir])

  const ecdf = useMemo(() => {
    if (!simP) return null
    const sorted = [...simP].sort((a, b) => a - b)
    const pts: [number, number][] = [[0, 0]]
    const N = sorted.length
    for (let i = 0; i < N; i++) {
      if (i + 1 < N && sorted[i + 1] === sorted[i]) continue
      pts.push([sorted[i], pts[pts.length - 1][1]])
      pts.push([sorted[i], (i + 1) / N])
    }
    pts.push([1, 1])
    return pts
  }, [simP])
  const simBelow = simP ? simP.filter((p) => p <= s.a).length : 0
  const atNull = s.ts === s.t0

  return (
    <>
      <StatusBar
        items={[
          ['모형', isNormal ? `X̄ ~ N(θ, ${s.sd}²/${s.n})` : `X ~ B(${s.n}, θ)`],
          ['가설', `H₀: θ = ${s.t0}`],
          ['자료 생성', `θ* = ${s.ts}${atNull ? ' (H₀가 참)' : ''}`],
        ]}
      />
      <LabLayout
        explain={
          <>
            <TextbookBadge>교재 7.5 · 프로그램 7.1</TextbookBadge>
            <h2 style={{ marginTop: 10 }}>p-값도 확률변수다</h2>
            <p>자료가 매번 달라지므로 p-값도 매번 달라집니다. H₀가 참일 때 p-값의 분포를 보면 α가 무엇을 보장하는지 알 수 있습니다.</p>
            <ul>
              <li>연속분포(정규): H₀ 아래 p-값은 U(0,1)을 따릅니다. 누적분포가 대각선과 겹칩니다.</li>
              <li>이산분포(동전): 계단 모양이고 대각선 아래에 놓입니다(초균등). 그래서 P(p ≤ α) ≤ α입니다.</li>
            </ul>
            <p>
              <strong>P(p ≤ α)</strong>는 θ* = θ₀이면 실제 크기, θ* ≠ θ₀이면 검정력입니다.
            </p>
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <h3 style={{ margin: '4px 4px 8px' }}>p-값의 누적분포 P(p ≤ u)</h3>
              <LineChart
                xDomain={[0, 1]}
                series={[
                  { pts: [[0, 0], [1, 1]], color: 'var(--c-border)', label: 'U(0,1) 기준선', dashed: true },
                  ...(ecdf ? [{ pts: ecdf, color: 'var(--c-text-tertiary)', label: '시뮬레이션 경험 누적분포' }] : []),
                  { pts: calc.cdf, color: 'var(--c-blue)', label: '정확한 누적분포' },
                ]}
                markers={[{ x: s.a, y: calc.pAtAlpha, color: atNull ? 'var(--c-null)' : 'var(--c-alt)', label: `P(p≤α) = ${fmtP(calc.pAtAlpha)}` }]}
                vlines={[{ x: s.a, label: `α = ${fmtAlpha(s.a)}` }]}
                xTitle="u"
                yTitle="P(p ≤ u)"
                ariaLabel={`p-값의 누적분포. P(p≤α) = ${fmtP(calc.pAtAlpha)}`}
              />
              <Legend
                items={[
                  { color: 'var(--c-blue)', label: '정확값' },
                  { color: 'var(--c-border)', label: 'U(0,1)', pattern: 'line' },
                  ...(ecdf ? [{ color: 'var(--c-text-tertiary)', label: '시뮬레이션' }] : []),
                ]}
              />
            </div>
            {simP && (
              <div className="panel chart-panel" style={{ marginTop: 16 }}>
                <h3 style={{ margin: '4px 4px 8px' }}>p-값 히스토그램 (밀도 척도)</h3>
                <ContinuousChart domain={[0, 1]} curves={[{ fn: () => 1, color: 'var(--c-border)', fill: 'transparent', label: 'U(0,1)' }]} hist={{ values: simP, bins: 20 }} ariaLabel="시뮬레이션 p-값 히스토그램" xTitle="p-값" yMaxHint={1.2} />
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '규칙의 성질', label: '유의수준 α', value: fmtAlpha(s.a) },
                  { tag: atNull ? 'H₀가 참일 때' : `θ* = ${s.ts}에서`, label: atNull ? 'P(p ≤ α) = 실제 크기' : 'P(p ≤ α) = 검정력', value: fmtP(calc.pAtAlpha), tone: atNull ? 'blue' : 'orange' },
                ]}
              />
            </div>
            <div className="math-panels panel">
              <Fold title="p-값의 초균등성 (증명 개요)" open>
                <p>
                  우측 검정에서 p(x) = P<sub>θ₀</sub>(X ≥ x)이고 이 함수는 x에 대해 감소합니다. 임의의 u에 대해 {'{'}p(X) ≤ u{'}'} = {'{'}X ≥ c<sub>u</sub>{'}'} 꼴이고, c<sub>u</sub>는 P(X ≥ c) ≤ u를 만족하는 가장 작은 c입니다.
                </p>
                <Tex block>{String.raw`P_{\theta_0}\big(p(X)\le u\big)=P_{\theta_0}(X\ge c_u)\le u`}</Tex>
                <p>연속분포에서는 등호가 성립하여 p(X) ~ U(0,1)입니다.</p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: true, t0: true, sd: true, a: true, dir: ['R', 'L', 'two'], ts: true }} tsLabel="실제 θ* (θ₀와 같으면 H₀가 참)" />
              <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => update({ ts: s.t0 })}>
                θ* = θ₀로 맞추기
              </button>
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label="p-값 반복 계산">
              {simP && <SimRate label="p ≤ α 비율" k={simBelow} B={simP.length} exact={calc.pAtAlpha} />}
            </SimPanel>
          </>
        }
      />
    </>
  )
}
