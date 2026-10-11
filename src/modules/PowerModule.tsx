import { useEffect, useMemo, useState } from 'react'
import { coinAutoRule, coinPowerCurve, coinPmf } from '../engine/coin'
import { expectPhi } from '../engine/discrete'
import { normPdf } from '../engine/core/normal'
import { normalAutoRule, normalPower, normalSampleSize, stdErr } from '../engine/normal'
import { LineChart, type LineSeries } from '../components/chart/LineChart'
import { ContinuousChart } from '../components/chart/ContinuousChart'
import { Fold, Legend, StatGrid, Tex, TextbookBadge } from '../components/ui'
import { SimPanel, SimRate } from '../components/SimPanel'
import { useSimulation } from '../lib/useSimulation'
import { fmtAlpha, fmtNum, fmtP } from '../lib/format'
import type { LabState } from '../state/labState'
import { CommonFields, LabLayout, StatusBar, ensureSeed, type Update } from './common'

interface Props {
  s: LabState
  update: Update
}

const SAVE_COLORS = ['#34aadc', '#1a7f37', '#b07700']

interface Saved {
  label: string
  pts: [number, number][]
}

export function PowerModule({ s, update }: Props) {
  const [saved, setSaved] = useState<Saved[]>([])
  useEffect(() => {
    setSaved([])
  }, [s.model])
  const isNormal = s.model === 'normal'
  const dir = isNormal ? s.dir : s.dir === 'two' ? 'R' : s.dir

  const se = stdErr(s.sd, s.n)
  const dLo = isNormal ? s.t0 - 4 * se - Math.abs(s.ts - s.t0) : 0
  const dHi = isNormal ? s.t0 + 4 * se + Math.abs(s.ts - s.t0) : 1
  const domain: [number, number] = [dLo, dHi]

  const calc = useMemo(() => {
    const grid = Array.from({ length: 201 }, (_, i) => dLo + ((dHi - dLo) * i) / 200)
    if (isNormal) {
      const rule = normalAutoRule(s.t0, s.sd, s.n, s.a, dir)
      const pts = grid.map((t) => [t, normalPower(rule, t, s.sd, s.n)] as [number, number])
      return { pts, size: normalPower(rule, s.t0, s.sd, s.n), powerTs: normalPower(rule, s.ts, s.sd, s.n), rule, phi: null, label: `n=${s.n}, α=${fmtAlpha(s.a)}` }
    }
    const rr = coinAutoRule(s.n, s.t0, s.a, dir as 'R' | 'L')
    const pv = coinPowerCurve(rr.phi, s.n, grid)
    return {
      pts: grid.map((t, i) => [t, pv[i]] as [number, number]),
      size: rr.size,
      powerTs: expectPhi(rr.phi, coinPmf(s.n, s.ts)),
      rule: null,
      phi: rr.phi,
      label: `n=${s.n}, c=${rr.c}, 크기 ${fmtP(rr.size)}`,
    }
  }, [isNormal, s.t0, s.sd, s.n, s.a, s.ts, dir, dLo, dHi])

  const simKey = JSON.stringify(['pow', s.model, s.n, s.t0, s.ts, s.sd, s.a, dir, s.B, s.seed])
  const sim = useSimulation(simKey)
  const run = () => {
    const seed = ensureSeed(s, update)
    const key = JSON.stringify(['pow', s.model, s.n, s.t0, s.ts, s.sd, s.a, dir, s.B, seed])
    if (isNormal && calc.rule) sim.run({ model: 'normal', n: s.n, theta: s.ts, sigma: s.sd, B: s.B, seed, rule: calc.rule }, key)
    else if (calc.phi) sim.run({ model: 'coin', n: s.n, theta: s.ts, B: s.B, seed, phi: [...calc.phi] }, key)
  }

  const series: LineSeries[] = [
    ...saved.map((sv, i) => ({ pts: sv.pts, color: SAVE_COLORS[i], label: sv.label, dashed: true })),
    { pts: calc.pts, color: 'var(--c-blue)', label: `현재: ${calc.label}` },
  ]
  const needN = isNormal && s.ts !== s.t0 ? normalSampleSize(s.ts - s.t0, s.sd, s.a, 0.8, dir) : null

  return (
    <>
      <StatusBar
        items={[
          ['모형', isNormal ? `X̄ ~ N(θ, ${s.sd}²/${s.n})` : `X ~ B(${s.n}, θ)`],
          ['가설', `H₀: θ = ${s.t0}  대  H₁: θ ${dir === 'R' ? '>' : dir === 'L' ? '<' : '≠'} ${s.t0}`],
          ['α', fmtAlpha(s.a)],
          ['θ*', String(s.ts)],
        ]}
      />
      <LabLayout
        explain={
          <>
            <TextbookBadge>교재 식 7.3 · 프로그램 7.3·7.4 · p.289</TextbookBadge>
            <h2 style={{ marginTop: 10 }}>검정력은 θ의 함수</h2>
            <p>검정력 π(θ) = P(X∈R | θ)는 실제 θ마다 다른 값을 가집니다. θ = θ₀에서의 값이 실제 크기이고, 대립가설 쪽에서의 값이 검정력입니다.</p>
            <p>
              <strong>곡선과 기각역은 n, θ₀, α, σ, 방향에만 의존합니다.</strong> θ*를 바꾸면 곡선 위의 점만 움직입니다.
            </p>
            <p>"비교에 저장"으로 n을 바꾼 곡선을 최대 3개까지 겹쳐 보세요.</p>
            {!isNormal && (
              <div className="note">
                이산분포에서는 n이 커져도 검정력이 줄 때가 있습니다. 크기가 α보다 얼마나 작은지가 n마다 다르기 때문입니다.
                <div className="row" style={{ marginTop: 8 }}>
                  <button
                    className="btn-outline sm"
                    onClick={() => {
                      const g = Array.from({ length: 201 }, (_, i) => i / 200)
                      const r18 = coinAutoRule(18, 0.5, 0.05, 'R')
                      const pv = coinPowerCurve(r18.phi, 18, g)
                      setSaved([{ label: `n=18, c=${r18.c}, 크기 ${fmtP(r18.size)}`, pts: g.map((t, i) => [t, pv[i]]) }])
                      update({ n: 20, t0: 0.5, a: 0.05, ts: 0.6, dir: 'R' })
                    }}
                  >
                    E07 불러오기: n=18 대 20
                  </button>
                </div>
              </div>
            )}
          </>
        }
        chart={
          <>
            <div className="panel chart-panel">
              <LineChart
                xDomain={domain}
                series={series}
                markers={[
                  { x: s.t0, y: calc.size, color: 'var(--c-null)', label: '크기' },
                  { x: s.ts, y: calc.powerTs, color: 'var(--c-alt)', label: `π(θ*)` },
                ]}
                hlines={[{ y: s.a, label: `α = ${fmtAlpha(s.a)}` }]}
                vlines={[{ x: s.t0, label: 'θ₀', color: 'var(--c-null)' }]}
                xTitle="실제 모수 θ"
                yTitle="기각 확률 π(θ)"
                ariaLabel={`검정력 곡선. θ*=${s.ts}에서 ${fmtP(calc.powerTs)}`}
              />
              <Legend items={series.map((sr) => ({ color: sr.color, label: sr.label, pattern: sr.dashed ? ('line' as const) : undefined }))} />
              <div className="row" style={{ margin: '0 4px 8px' }}>
                <button className="btn-outline sm" disabled={saved.length >= 3} onClick={() => setSaved([...saved, { label: calc.label, pts: calc.pts }])}>
                  비교에 저장 ({saved.length}/3)
                </button>
                {saved.length > 0 && (
                  <button className="btn-ghost" onClick={() => setSaved([])}>
                    비교 지우기
                  </button>
                )}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <StatGrid
                stats={[
                  { tag: '규칙의 성질', label: '실제 크기 π(θ₀)', value: fmtP(calc.size), tone: 'blue' },
                  { tag: 'θ*에서의 성질', label: `검정력 π(${s.ts})`, value: fmtP(calc.powerTs), tone: 'orange' },
                  { tag: 'θ*에서의 성질', label: `β(${s.ts})`, value: fmtP(1 - calc.powerTs), tone: 'orange' },
                  needN !== null
                    ? { tag: '표본크기 계획', label: '검정력 0.8에 필요한 n', value: String(Math.ceil(needN - 1e-9)), sub: `계산값 ${fmtNum(needN, 2)}` }
                    : { tag: '규칙', label: '임계값', value: isNormal ? fmtNum(dir === 'L' ? calc.rule!.lower! : calc.rule!.upper!, 3) : '—' },
                ]}
              />
            </div>
            {isNormal && calc.rule && (
              <div className="panel chart-panel" style={{ marginTop: 16 }}>
                <h3 style={{ margin: '4px 4px 8px' }}>두 분포로 보는 검정력 (교재 프로그램 7.3의 power.examp)</h3>
                <ContinuousChart
                  domain={[Math.min(s.t0, s.ts) - 4 * se, Math.max(s.t0, s.ts) + 4 * se]}
                  curves={[
                    { fn: (x) => normPdf((x - s.t0) / se) / se, color: 'var(--c-null)', fill: 'var(--c-null-fill)', label: 'H₀' },
                    { fn: (x) => normPdf((x - s.ts) / se) / se, color: 'var(--c-alt)', fill: 'var(--c-alt-fill)', label: 'θ*' },
                  ]}
                  shades={[
                    ...(calc.rule.upper !== undefined ? [{ curve: 1, from: calc.rule.upper, to: Infinity, kind: 'reject' as const }] : []),
                    ...(calc.rule.lower !== undefined ? [{ curve: 1, from: -Infinity, to: calc.rule.lower, kind: 'reject' as const }] : []),
                  ]}
                  hist={sim.result?.values ? { values: sim.result.values, bins: 50 } : null}
                  ariaLabel="귀무분포와 실제 분포, 검정력 영역"
                  xTitle="x̄"
                />
                <Legend items={[{ color: 'var(--c-null)', label: `H₀: θ=${s.t0}` }, { color: 'var(--c-alt)', label: `θ*=${s.ts}` }, { color: 'var(--c-reject)', label: '검정력 = θ* 분포의 기각역 넓이', pattern: 'hatch' }]} />
              </div>
            )}
            <div className="math-panels panel">
              <Fold title="수식" open>
                {isNormal ? (
                  <Tex block>{dir === 'R' ? String.raw`\pi(\theta)=1-\Phi\!\left(z_\alpha-\frac{\sqrt n(\theta-\theta_0)}{\sigma}\right),\qquad n\approx\left(\frac{(z_\alpha+z_\beta)\sigma}{\theta^*-\theta_0}\right)^2` : dir === 'L' ? String.raw`\pi(\theta)=\Phi\!\left(-z_\alpha-\frac{\sqrt n(\theta-\theta_0)}{\sigma}\right)` : String.raw`\pi(\theta)=1-\Phi\!\left(z_{\alpha/2}-\delta\right)+\Phi\!\left(-z_{\alpha/2}-\delta\right),\ \ \delta=\frac{\sqrt n(\theta-\theta_0)}{\sigma}`}</Tex>
                ) : (
                  <Tex block>{String.raw`\pi(\theta)=\sum_{x}\varphi(x)\binom{n}{x}\theta^{x}(1-\theta)^{n-x}`}</Tex>
                )}
              </Fold>
              <Fold title="관측 검정력(사후 검정력)을 계산하지 않는 이유">
                <p>관측한 효과크기를 넣어 계산한 검정력은 p-값을 다시 변환한 값이라 새로운 정보를 주지 않습니다. 검정력은 자료를 모으기 전에 표본크기를 정하는 데 씁니다.</p>
              </Fold>
            </div>
          </>
        }
        settings={
          <>
            <div className="panel">
              <h3>설정</h3>
              <CommonFields s={s} update={update} show={{ n: true, t0: true, sd: true, a: true, dir: isNormal ? ['R', 'L', 'two'] : ['R', 'L'], ts: true }} tsLabel="실제 θ* (곡선 위 표시점)" />
            </div>
            <SimPanel B={s.B} onB={(b) => update({ B: b })} seed={s.seed} status={sim.status} results={[{ label: 'sim', result: sim.result }]} progress={sim.progress} onRun={run} onStop={sim.stop} onReset={() => update({ seed: null })} label={`θ* = ${s.ts}에서 반복 판정`}>
              {sim.result && <SimRate label="기각 비율 → 검정력 추정" k={sim.result.rejects} B={sim.result.B} exact={calc.powerTs} />}
            </SimPanel>
            {isNormal && (
              <div className="panel">
                <h3>교재 프로그램 7.3 재현</h3>
                <p className="muted" style={{ fontSize: '0.8rem' }}>
                  diff = 1, σ = 1, α = 0.05, 단측. 교재 해석: n = 1이면 0.2595, n = 10이면 0.9354.
                </p>
                <div className="row">
                  <button className="btn-outline sm" onClick={() => update({ n: 1, t0: 0, ts: 1, sd: 1, a: 0.05, dir: 'R' })}>
                    n = 1
                  </button>
                  <button className="btn-outline sm" onClick={() => update({ n: 10, t0: 0, ts: 1, sd: 1, a: 0.05, dir: 'R' })}>
                    n = 10
                  </button>
                </div>
              </div>
            )}
          </>
        }
      />
    </>
  )
}

