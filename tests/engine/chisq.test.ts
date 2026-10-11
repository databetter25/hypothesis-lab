import { describe, expect, it } from 'vitest'
import golden from '../golden/golden.json'
import { chi2Pdf, chi2PpfUpper, chi2Sf, gofExact, gofTest, indepTest, parseCountMatrix } from '../../src/engine/chisq'
import { chi2Sf1 } from '../../src/engine/core/normal'
import { simulate } from '../../src/engine/simulate'
import { wilson } from '../../src/engine/core/stats'

const rel = (a: number, b: number, tol = 1e-10) => expect(Math.abs(a - b)).toBeLessThan(tol * Math.max(1, Math.abs(b)))

describe('χ²분포 (일반 자유도)', () => {
  it('상단 꼬리가 SciPy와 일치', () => {
    for (const [x, k, p] of golden.chi2dist.sf) rel(chi2Sf(x, k), p, 1e-10)
  })
  it('밀도가 SciPy와 일치', () => {
    for (const [x, k, d] of golden.chi2dist.pdf) rel(chi2Pdf(x, k), d, 1e-10)
  })
  it('상위 5% 분위수가 SciPy와 일치', () => {
    for (const [k, q] of golden.chi2dist.ppf95) rel(chi2PpfUpper(0.05, k), q, 1e-9)
  })
  it('자유도 1은 정규 기반 계산과 일치', () => {
    for (const x of [0.1, 1, 3.84, 10]) rel(chi2Sf(x, 1), chi2Sf1(x), 1e-12)
  })
})

describe('적합도 검정 (교재 7.4)', () => {
  it('Mendel 완두 9:3:3:1', () => {
    const r = gofTest([315, 101, 108, 32], [9 / 16, 3 / 16, 3 / 16, 1 / 16])
    rel(r.X2, golden.X_mendel.X2)
    rel(r.pX2, golden.X_mendel.p)
    rel(r.G, golden.X_mendel.G)
    rel(r.pG, golden.X_mendel.pG)
    expect(r.df).toBe(3)
  })
  it('범주 2개이면 X² = z² (동전 14/20)', () => {
    const r = gofTest([14, 6], [0.5, 0.5])
    rel(r.X2, golden.X_coinK2.X2)
    rel(r.pX2, golden.X_coinK2.p)
    const z = (14 - 10) / Math.sqrt(20 * 0.25)
    rel(r.X2, z * z)
  })
  it('기대도수가 작은 경우 경고 정보', () => {
    const r = gofTest([1, 5, 3, 2, 4], [0.2, 0.2, 0.2, 0.2, 0.2])
    rel(r.X2, golden.X_small.X2)
    rel(r.pX2, golden.X_small.p)
    expect(r.minE).toBe(3)
  })
  it('관측도수 0인 칸은 G에서 0·log 0 = 0', () => {
    const r = gofTest([0, 10], [0.5, 0.5])
    expect(Number.isFinite(r.G)).toBe(true)
    rel(r.G, 2 * 10 * Math.log(2))
  })
})

describe('독립성 검정 (교재 예 7.9)', () => {
  it('2×3 분할표', () => {
    const r = indepTest([
      [20, 30, 25],
      [30, 20, 25],
    ])
    rel(r.X2, golden.X_2x3.X2)
    rel(r.pX2, golden.X_2x3.p)
    rel(r.G, golden.X_2x3.G)
    expect(r.df).toBe(golden.X_2x3.df)
    r.E.forEach((row, i) => row.forEach((e, j) => rel(e, golden.X_2x3.E[i][j])))
  })
  it('2×2 분할표 (연속성 보정 없음)', () => {
    const r = indepTest([
      [30, 10],
      [15, 25],
    ])
    rel(r.X2, golden.X_2x2.X2)
    rel(r.pX2, golden.X_2x2.p)
  })
})

describe('도수 입력 파싱', () => {
  it('행은 /, 칸은 ,', () => {
    expect(parseCountMatrix('20,30,25/30,20,25')).toEqual({ ok: true, rows: [[20, 30, 25], [30, 20, 25]] })
    expect(parseCountMatrix('1,2/3').ok).toBe(false)
    expect(parseCountMatrix('1,-2').ok).toBe(false)
    expect(parseCountMatrix('1.5,2').ok).toBe(false)
  })
})

describe('다항 시뮬레이션', () => {
  it('H₀ 아래 X² 기각 비율이 Wilson 구간에서 정확한 크기 근처 (Mendel, n=556)', () => {
    const p0 = [9 / 16, 3 / 16, 3 / 16, 1 / 16]
    const crit = chi2PpfUpper(0.05, 3)
    const r = simulate({ model: 'multinomial', probs: p0, n: 556, B: 4000, seed: 1, shape: null, crit })
    const [lo, hi] = wilson(r.rejects, r.B)
    expect(lo).toBeLessThan(0.065)
    expect(hi).toBeGreaterThan(0.035)
    expect(r.values!.length).toBe(4000)
    expect(r.values2!.length).toBe(4000)
  })
  it('같은 시드면 같은 결과', () => {
    const s = { model: 'multinomial' as const, probs: [0.25, 0.25, 0.25, 0.25], n: 50, B: 500, seed: 7, shape: [2, 2] as [number, number], crit: 3.84 }
    expect(simulate(s).values).toEqual(simulate(s).values)
  })
})

describe('적합도의 정확 계산 (전수)', () => {
  it('기대도수가 작은 경우: 크기와 정확 p-값', () => {
    const r = gofTest([1, 5, 3, 2, 4], [0.2, 0.2, 0.2, 0.2, 0.2])
    const ex = gofExact(15, [0.2, 0.2, 0.2, 0.2, 0.2], 0.05, r.X2)!
    rel(ex.sizeX2, golden.X_small_exact.sizeX2)
    rel(ex.sizeG, golden.X_small_exact.sizeG)
    rel(ex.pX2, golden.X_small_exact.pX2)
    expect(ex.outcomes).toBe(3876)
  })
  it('범주 2개: 정확 p-값이 이항 양측 정확 검정(E06)과 같다', () => {
    const ex = gofExact(20, [0.5, 0.5], 0.05, 3.2)!
    rel(ex.pX2, golden.X_coinK2_exact.pX2)
    rel(ex.pX2, golden.E06.pLrt14)
  })
  it('결과 수가 많으면 계산하지 않는다 (Mendel n = 556)', () => {
    expect(gofExact(556, [9 / 16, 3 / 16, 3 / 16, 1 / 16], 0.05, 0.47)).toBeNull()
  })
  it('시뮬레이션이 정확한 크기와 일치 (A15 방식)', () => {
    const ex = gofExact(15, [0.2, 0.2, 0.2, 0.2, 0.2], 0.05, 3.33)!
    let hit = 0
    for (let seed = 1; seed <= 20; seed++) {
      const r = simulate({ model: 'multinomial', probs: [0.2, 0.2, 0.2, 0.2, 0.2], n: 15, B: 5000, seed, shape: null, crit: chi2PpfUpper(0.05, 4) })
      const [lo, hi] = wilson(r.rejects, r.B)
      if (lo <= ex.sizeX2 && ex.sizeX2 <= hi) hit++
    }
    expect(hit).toBeGreaterThanOrEqual(17)
  })
})
