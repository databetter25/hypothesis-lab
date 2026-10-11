import { describe, expect, it } from 'vitest'
import { simulate } from '../../src/engine/simulate'
import { coinAutoRule, coinPmf } from '../../src/engine/coin'
import { npRandomized, powerAt } from '../../src/engine/discrete'
import { normalAutoRule } from '../../src/engine/normal'
import { wilson } from '../../src/engine/core/stats'

describe('시뮬레이션', () => {
  const rule = coinAutoRule(20, 0.5, 0.05, 'R')

  it('A08 같은 시드·설정이면 같은 결과', () => {
    const s = { model: 'coin' as const, n: 20, theta: 0.7, B: 2000, seed: 42, phi: [...rule.phi] }
    expect(simulate(s)).toEqual(simulate(s))
  })

  it('A08 결정적 규칙과 확률화 규칙에서 같은 시드면 표본이 같다', () => {
    const np = npRandomized(coinPmf(20, 0.5), coinPmf(20, 0.7), 0.05)
    const a = simulate({ model: 'coin', n: 20, theta: 0.5, B: 3000, seed: 9, phi: [...rule.phi] })
    const b = simulate({ model: 'coin', n: 20, theta: 0.5, B: 3000, seed: 9, phi: [...np.phi] })
    expect(a.counts).toEqual(b.counts)
  })

  it('A15 고정 시드 20개 중 17개 이상에서 Wilson 구간이 정확값을 포함', () => {
    const exact = powerAt(rule.phi, coinPmf(20, 0.7))
    let hit = 0
    for (let seed = 1; seed <= 20; seed++) {
      const r = simulate({ model: 'coin', n: 20, theta: 0.7, B: 10000, seed, phi: [...rule.phi] })
      const [lo, hi] = wilson(r.rejects, r.B)
      if (lo <= exact && exact <= hi) hit++
    }
    expect(hit).toBeGreaterThanOrEqual(17)
  })

  it('확률화 규칙의 기각 비율이 α에 가깝다', () => {
    const np = npRandomized(coinPmf(20, 0.5), coinPmf(20, 0.7), 0.05)
    const r = simulate({ model: 'coin', n: 20, theta: 0.5, B: 20000, seed: 3, phi: [...np.phi] })
    expect(Math.abs(r.rejects / r.B - 0.05)).toBeLessThan(4 * Math.sqrt((0.05 * 0.95) / 20000))
  })

  it('T09 정규 H₀ 양측 기각 비율 ≈ 0.05', () => {
    const r = simulate({ model: 'normal', n: 10, theta: 0, sigma: 1, B: 10000, seed: 5, rule: normalAutoRule(0, 1, 10, 0.05, 'two') })
    const [lo, hi] = wilson(r.rejects, r.B)
    expect(lo).toBeLessThan(0.05)
    expect(hi).toBeGreaterThan(0.05)
    let m = 0
    for (const v of r.values!) m += v
    expect(Math.abs(m / r.B)).toBeLessThan(4 / Math.sqrt(10 * 10000))
  })

  it('홍차: 4잔 모두 맞힐 비율 ≈ 1/70', () => {
    const r = simulate({ model: 'tea', B: 70000, seed: 11, phi: [0, 0, 0, 0, 1] })
    expect(Math.abs(r.rejects / r.B - 1 / 70)).toBeLessThan(4 * Math.sqrt((1 / 70) * (69 / 70) / 70000))
    expect(r.counts!.reduce((a, b) => a + b, 0)).toBe(70000)
  })

  it('이산 확률표 표본 빈도', () => {
    const r = simulate({ model: 'table', probs: [0.4, 0.3, 0.2, 0.1], B: 20000, seed: 2, phi: [0, 0, 1, 1] })
    expect(Math.abs(r.rejects / r.B - 0.3)).toBeLessThan(0.015)
  })
})
