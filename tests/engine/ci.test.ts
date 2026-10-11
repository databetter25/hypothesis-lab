import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import golden from '../golden/golden.json'
import { coinAcceptance, coinCI, coinCoverage, coinPFunction, incBeta, normalCI, normalPFunction, type CIMethod } from '../../src/engine/ci'
import { coinPValue } from '../../src/engine/coin'

const rel = (a: number, b: number, tol = 1e-10) => expect(Math.abs(a - b)).toBeLessThan(tol * Math.max(1, Math.abs(b)))

describe('불완전 베타', () => {
  it('SciPy betainc와 일치', () => {
    for (const [a, b, x, v] of golden.betainc) rel(incBeta(a, b, x), v, 1e-10)
  })
})

describe('동전 신뢰구간 (교재 8.6)', () => {
  it('x = 14, n = 20 세 방법', () => {
    coinCI(14, 20, 0.05, 'cp').forEach((v, i) => rel(v, golden.CI.cp14[i], 1e-9))
    coinCI(14, 20, 0.05, 'wilson').forEach((v, i) => rel(v, golden.CI.wilson14[i]))
    coinCI(14, 20, 0.05, 'wald').forEach((v, i) => rel(v, golden.CI.wald14[i]))
  })
  it('CP 경계: x = 0, n', () => {
    coinCI(0, 20, 0.05, 'cp').forEach((v, i) => rel(v, golden.CI.cp0[i], 1e-9))
    coinCI(20, 20, 0.05, 'cp').forEach((v, i) => rel(v, golden.CI.cp20[i], 1e-9))
  })
  it('교재 예 8.8: n = 400, 표본비율 0.7 → [0.655, 0.745]', () => {
    coinCI(280, 400, 0.05, 'wald').forEach((v, i) => rel(v, golden.CI.ex88[i]))
  })
  it('정확한 포함확률', () => {
    for (const m of ['cp', 'wilson', 'wald'] as CIMethod[]) {
      for (const [t, v] of Object.entries(golden.CI.cover[m])) rel(coinCoverage(20, Number(t), 0.05, m), v as number, 1e-8)
    }
  })
  it('CP 검정의 p-값은 동전 양측(꼬리 × 2) p-값과 같다', () => {
    rel(coinPFunction(14, 20, 0.5, 'cp'), coinPValue(20, 0.5, 14, 'two-tail'))
    rel(coinPFunction(8, 20, 0.2, 'cp'), coinPValue(20, 0.2, 8, 'two-tail'))
  })
})

describe('쌍대성 (교재 식 8.59): θ₀ ∈ C(x) ⇔ H₀: θ = θ₀를 기각하지 못함', () => {
  it('동전 세 방법, 무작위 x·n·θ₀ (경계 근처 제외)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 200 }), fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0.001, max: 0.999, noNaN: true }), fc.constantFrom('cp', 'wilson', 'wald') as fc.Arbitrary<CIMethod>, (n, u, t0, m) => {
        const x = Math.min(n, Math.floor(u * (n + 1)))
        const [lo, hi] = coinCI(x, n, 0.05, m)
        if (Math.abs(t0 - lo) < 1e-6 || Math.abs(t0 - hi) < 1e-6) return true
        const inside = lo < t0 && t0 < hi
        return inside === coinPFunction(x, n, t0, m) > 0.05
      }),
      { numRuns: 600 },
    )
  })
  it('수용역의 세로 조각과 신뢰구간의 가로 조각이 일치 (신뢰띠)', () => {
    const n = 15
    const cis = Array.from({ length: n + 1 }, (_, x) => coinCI(x, n, 0.05, 'cp'))
    for (const t0 of [0.07, 0.3, 0.52, 0.88]) {
      const A = coinAcceptance(n, t0, 0.05, 'cp')
      A.forEach((acc, x) => expect(acc).toBe(cis[x][0] < t0 && t0 < cis[x][1]))
    }
  })
  it('정규: 구간과 p-값 함수', () => {
    normalCI(0.6, 1, 10, 0.05, 'two').forEach((v, i) => rel(v, golden.CI.normal[i]))
    fc.assert(
      fc.property(fc.double({ min: -3, max: 3, noNaN: true }), fc.constantFrom('R' as const, 'L' as const, 'two' as const), (t0, dir) => {
        const [lo, hi] = normalCI(0.6, 1, 10, 0.05, dir)
        if (Math.abs(t0 - lo) < 1e-9 || Math.abs(t0 - hi) < 1e-9) return true
        return (lo < t0 && t0 < hi) === normalPFunction(0.6, 1, 10, t0, dir) > 0.05
      }),
      { numRuns: 300 },
    )
  })
})
