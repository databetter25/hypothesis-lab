import { describe, expect, it } from 'vitest'
import golden from '../golden/golden.json'
import { multiExact, multiReject, seqExact, seqLooks, twoTailBounds } from '../../src/engine/pitfalls'
import { coinLrtRule, coinPValue } from '../../src/engine/coin'
import { simulate } from '../../src/engine/simulate'
import { wilson } from '../../src/engine/core/stats'

const rel = (a: number, b: number, tol = 1e-10) => expect(Math.abs(a - b)).toBeLessThan(tol * Math.max(1, Math.abs(b)))

describe('선택적 중단: 정확 계산 (동적계획)', () => {
  it('엿보기 시점의 기각역은 양측(꼬리×2) 정확 검정과 같다', () => {
    expect(twoTailBounds(20, 0.5, 0.05)).toEqual(golden.SEQ.bounds20)
    for (let x = 0; x <= 20; x++) {
      const [lo, hi] = twoTailBounds(20, 0.5, 0.05)
      expect(x <= lo || x >= hi).toBe(coinPValue(20, 0.5, x, 'two-tail') <= 0.05)
    }
  })
  it('한 번만 보면 고정 표본 검정의 크기와 같다', () => {
    rel(seqExact(0.5, 0.5, [100], 0.05).reject, golden.SEQ.single100)
    rel(seqExact(0.5, 0.5, [20], 0.05).reject, coinLrtRule(20, 0.5, 0.05).size)
  })
  it('10번 엿보면 크기가 부풀고, 매번 보면 더 부푼다', () => {
    const looks = seqLooks(10, 100, 10)
    expect(looks).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
    rel(seqExact(0.5, 0.5, looks, 0.05).reject, golden.SEQ.looks10_100)
    rel(seqExact(0.5, 0.5, looks, 0.005).reject, golden.SEQ.looks10_100_bonf)
    rel(seqExact(0.5, 0.5, seqLooks(1, 100, 1), 0.05).reject, golden.SEQ.every_1_100)
    rel(seqExact(0.7, 0.5, looks, 0.05).reject, golden.SEQ.power07)
  })
  it('누적 기각 확률은 단조 증가하고, 기대 표본크기는 n_max 이하', () => {
    const r = seqExact(0.5, 0.5, seqLooks(10, 100, 10), 0.05)
    for (let i = 1; i < r.cumulative.length; i++) expect(r.cumulative[i]).toBeGreaterThanOrEqual(r.cumulative[i - 1])
    expect(r.expectedN).toBeLessThanOrEqual(100)
  })
  it('시뮬레이션이 정확값과 일치 (A15 방식)', () => {
    const looks = seqLooks(10, 100, 10)
    const ex = seqExact(0.5, 0.5, looks, 0.05)
    let hit = 0
    for (let seed = 1; seed <= 20; seed++) {
      const r = simulate({ model: 'seq', theta: 0.5, looks, bounds: ex.bounds, B: 4000, seed })
      const [lo, hi] = wilson(r.rejects, r.B)
      if (lo <= ex.reject && ex.reject <= hi) hit++
    }
    expect(hit).toBeGreaterThanOrEqual(17)
  })
})

describe('다중검정', () => {
  it('정확한 FWER', () => {
    const e = multiExact(20, 20, 0, 0.05)
    rel(e.fwerNone, golden.MULTI.fwer20)
    rel(e.fwerBonf, golden.MULTI.fwerBonf20)
    rel(multiExact(20, 15, 2, 0.05).fdrBH, golden.MULTI.bhFdr.fdr)
  })
  it('방법별 기각 (교과서 예시)', () => {
    const p = [0.001, 0.008, 0.039, 0.041, 0.042, 0.06, 0.074, 0.205, 0.212, 0.216]
    expect(multiReject(p, 0.05, 'none').filter(Boolean).length).toBe(5)
    expect(multiReject(p, 0.05, 'bonf').filter(Boolean).length).toBe(1)
    expect(multiReject(p, 0.05, 'holm').filter(Boolean).length).toBe(1)
    // BH: p(2) = 0.008 ≤ 2·0.05/10 = 0.01, p(3) = 0.039 > 0.015 … 가장 큰 k = 2
    expect(multiReject(p, 0.05, 'bh').filter(Boolean).length).toBe(2)
  })
  it('시뮬레이션: FWER(보정 없음)·BH의 FDR이 정확값과 일치', () => {
    const r = simulate({ model: 'multi', m: 20, m0: 15, delta: 2.5, alpha: 0.05, B: 20000, seed: 9 })
    const e = multiExact(20, 15, 2.5, 0.05)
    const [lo, hi] = wilson(r.extra!.none_fwer, r.B)
    expect(lo <= e.fwerNone && e.fwerNone <= hi).toBe(true)
    const fdr = r.extra!.bh_fdp / r.B
    expect(Math.abs(fdr - e.fdrBH)).toBeLessThan(0.006)
    expect(r.extra!.holm_fwer / r.B).toBeLessThan(0.06)
    expect(r.extra!.holm_pow).toBeGreaterThanOrEqual(r.extra!.bonf_pow)
  })
})
