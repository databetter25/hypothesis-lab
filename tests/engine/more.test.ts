import { describe, expect, it } from 'vitest'
import golden from '../golden/golden.json'
import { nvarMP, nvarPValue, poisMP, poisPValue, poisTable } from '../../src/engine/more'
import { simulate } from '../../src/engine/simulate'
import { wilson } from '../../src/engine/core/stats'

const rel = (a: number, b: number, tol = 1e-10) => expect(Math.abs(a - b)).toBeLessThan(tol * Math.max(1, Math.abs(b)))

describe('포아송 (교재 예 7.3)', () => {
  it('α = 4e⁻³에서 최강력 기각역 ΣXᵢ ≤ 1, 검정력 2e⁻¹', () => {
    const r = poisMP(10, 0.3, 0.1, 4 * Math.exp(-3))
    expect(r.side).toBe('L')
    expect(r.c).toBe(1)
    rel(r.size, golden.T03.alpha)
    rel(r.power, golden.T03.power)
  })
  it('α = 0.05: 비확률화 c = 0, 확률화 γ와 검정력', () => {
    const r = poisMP(10, 0.3, 0.1, 0.05)
    expect(r.c).toBe(golden.POIS.c05_left)
    rel(r.np.gamma, golden.POIS.np05_gamma, 1e-9)
    rel(r.npPower, golden.POIS.np05_power, 1e-9)
    rel(r.np.size, 0.05, 1e-12)
  })
  it('p-값', () => {
    rel(poisPValue(1, 10, 0.3, 'L'), golden.POIS.p_t1)
    rel(poisPValue(6, 10, 0.3, 'R'), golden.POIS.p_t6_right)
  })
  it('잘라 쓴 표의 합은 1', () => {
    const f = poisTable(30, 120)
    rel(f.reduce((a, b) => a + b, 0), 1, 1e-12)
  })
})

describe('정규 분산 (교재 예 7.5: n = 5, μ = 1 기지)', () => {
  it('σ₁ > σ₀: W ≥ χ²_α(n)', () => {
    const r = nvarMP(5, 1, Math.SQRT2, 0.05)
    rel(r.c, golden.NVAR.crit, 1e-9)
    rel(r.power, golden.NVAR.power2, 1e-9)
    rel(nvarMP(5, 1, 2, 0.05).power, golden.NVAR.power4, 1e-9)
  })
  it('σ₁ < σ₀: W ≤ χ²_{1−α}(n)', () => {
    const r = nvarMP(5, 1, Math.SQRT1_2, 0.05)
    expect(r.side).toBe('L')
    rel(r.c, golden.NVAR.critLow, 1e-9)
    rel(r.power, golden.NVAR.powerLowHalf, 1e-9)
  })
  it('p-값', () => rel(nvarPValue(9, 5, 'R'), golden.NVAR.p_obs))
  it('시뮬레이션: H₀ 아래 기각 비율 ≈ α', () => {
    const r = nvarMP(5, 1, 2, 0.05)
    const sim = simulate({ model: 'nvar', n: 5, mu: 1, sigma: 1, sigma0: 1, B: 20000, seed: 6, upper: r.c })
    const [lo, hi] = wilson(sim.rejects, sim.B)
    expect(lo < 0.05 && 0.05 < hi).toBe(true)
    const simAlt = simulate({ model: 'nvar', n: 5, mu: 1, sigma: 2, sigma0: 1, B: 20000, seed: 7, upper: r.c })
    const [a, b] = wilson(simAlt.rejects, simAlt.B)
    expect(a < r.power && r.power < b).toBe(true)
  })
})
