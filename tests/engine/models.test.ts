import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import golden from '../golden/golden.json'
import {
  coinAutoRule, coinLrtPValue, coinLrtRule, coinPmf, coinPValue, coinWilksSize,
} from '../../src/engine/coin'
import { expectPhi, npRandomized, pValueDistribution, powerAt } from '../../src/engine/discrete'
import {
  normalAutoRule, normalPower, normalPValue, normalSampleSize, normalNP,
} from '../../src/engine/normal'
import { parseTable, tableBestNonRandomized, tableNP, tableSetSize } from '../../src/engine/table'
import { teaPmf, teaPValue } from '../../src/engine/tea'

const TOL = 1e-10
const close = (a: number, b: number, tol = TOL) => expect(Math.abs(a - b)).toBeLessThan(tol)

describe('동전 pmf', () => {
  it('SciPy와 일치', () => {
    for (const g of golden.pmf) {
      const f = coinPmf(g.n, g.theta)
      g.values.forEach((v, i) => close(f[i], v, 1e-13))
    }
  })
  it('퇴화분포 θ=0, 1', () => {
    expect(coinPmf(5, 0)[0]).toBe(1)
    expect(coinPmf(5, 1)[5]).toBe(1)
  })
})

describe('E 시리즈', () => {
  it('E01 단측 p-값과 양측(×2)', () => {
    close(coinPValue(20, 0.5, 14, 'R'), golden.E01.pRight)
    close(coinPValue(20, 0.5, 14, 'two-tail'), golden.E01.pTwoTail)
  })
  it('E02 자동 임계값과 크기', () => {
    const r = coinAutoRule(20, 0.5, 0.05, 'R')
    expect(r.c).toBe(golden.E02.c)
    close(r.size, golden.E02.size)
    close(r.nextSize!, golden.E02.sizeWider)
  })
  it('E03 검정력', () => {
    const { phi } = coinAutoRule(20, 0.5, 0.05, 'R')
    close(powerAt(phi, coinPmf(20, 0.7)), golden.E03.power07)
    close(powerAt(phi, coinPmf(20, 0.55)), golden.E03.power055)
    close(powerAt(phi, coinPmf(20, 0.9)), golden.E03.power09)
  })
  it('E04, E07 표본크기별 규칙', () => {
    for (const g of golden.E04) {
      const r = coinAutoRule(g.n, 0.5, 0.05, 'R')
      expect(r.c).toBe(g.c)
      close(r.size, g.size)
      close(powerAt(r.phi, coinPmf(g.n, 0.7)), g.power07)
    }
    for (const g of golden.E07) {
      const r = coinAutoRule(g.n, 0.5, 0.05, 'R')
      expect(r.c).toBe(g.c)
      close(powerAt(r.phi, coinPmf(g.n, 0.6)), g.power06)
    }
  })
  it('E05 확률화 NP', () => {
    const f0 = coinPmf(20, 0.5), f1 = coinPmf(20, 0.7)
    const np = npRandomized(f0, f1, 0.05)
    close(np.gamma, golden.E05.gamma)
    expect(np.boundary).toEqual([golden.E05.boundary])
    close(expectPhi(np.phi, f0), 0.05, 1e-12)
    close(expectPhi(np.phi, f1), golden.E05.randPower07)
  })
  it('E06 양측 LRT', () => {
    const r = coinLrtRule(20, 0.5, 0.05)
    const rej = [...r.phi].flatMap((v, i) => (v === 1 ? [i] : []))
    expect(rej).toEqual(golden.E06.reject)
    close(r.size, golden.E06.size)
    close(coinLrtPValue(20, 0.5, 14), golden.E06.pLrt14)
    close(coinLrtPValue(20, 0.5, 0), golden.E06.pLrt0)
  })
  it('E08 두 양측 p-값의 차이', () => {
    close(coinLrtPValue(20, 0.2, 8), golden.E08.pLrt)
    close(coinPValue(20, 0.2, 8, 'two-tail'), golden.E08.pTwoTail)
  })
  it('E09 p-값의 분포', () => {
    const pv = Array.from({ length: 21 }, (_, x) => coinPValue(20, 0.5, x, 'R'))
    const d0 = pValueDistribution(pv, coinPmf(20, 0.5))
    const below = (d: { value: number; prob: number }[]) => d.filter((e) => e.value <= 0.05).reduce((s, e) => s + e.prob, 0)
    close(below(d0), golden.E09.h0)
    close(below(pValueDistribution(pv, coinPmf(20, 0.7))), golden.E09.alt07)
  })
  it('E10 UMP: θ₁ > θ₀이면 φ 동일, θ₁ < θ₀이면 반대 꼬리', () => {
    const f0 = coinPmf(20, 0.5)
    const base = npRandomized(f0, coinPmf(20, 0.7), 0.05).phi
    for (const t1 of [0.55, 0.6, 0.9, 0.99]) {
      const phi = npRandomized(f0, coinPmf(20, t1), 0.05).phi
      phi.forEach((v, i) => close(v, base[i], 1e-12))
    }
    const left = npRandomized(f0, coinPmf(20, 0.3), 0.05)
    expect(left.boundary).toEqual([golden.E10.leftBoundary])
    close(left.gamma, golden.E10.leftGamma)
  })
  it('E11 Arbuthnot', () => {
    expect(coinPValue(82, 0.5, 82, 'R') / golden.E11.p).toBeCloseTo(1, 10)
  })
  it('T08 교재 연습문제 3~5', () => {
    const { phi } = { phi: Float64Array.from([0, 0, 0, 0, 1, 1]) }
    close(expectPhi(phi, coinPmf(5, 0.5)), golden.T08.alpha)
    close(1 - expectPhi(phi, coinPmf(5, 2 / 3)), golden.T08.beta)
    const mp = coinAutoRule(5, 0.5, 1 / 32, 'R')
    expect(mp.c).toBe(5)
    close(powerAt(mp.phi, coinPmf(5, 2 / 3)), golden.T08.mpPower)
  })
  it('W 시리즈 Wilks', () => {
    for (const g of golden.W) close(coinWilksSize(g.n, g.theta0, 0.05), g.size)
  })
})

describe('불변식 A13: [x ∈ R] ⇔ [p ≤ α]', () => {
  it('동전 우측·좌측', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 1, max: 99 }),
        fc.constantFrom(0.001, 0.01, 0.025, 0.05, 0.1, 0.2),
        fc.constantFrom('R' as const, 'L' as const),
        (n, t, a, dir) => {
          const th = t / 100
          const { phi } = coinAutoRule(n, th, a, dir)
          for (let x = 0; x <= n; x++) {
            const p = coinPValue(n, th, x, dir)
            if ((phi[x] === 1) !== (p <= a)) return false
          }
          return true
        },
      ),
      { numRuns: 150 },
    )
  })
  it('정규 우측·좌측·양측', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -3, max: 3, noNaN: true }),
        fc.constantFrom('R' as const, 'L' as const, 'two' as const),
        fc.constantFrom(0.01, 0.05, 0.1),
        (xbar, dir, a) => {
          const rule = normalAutoRule(0, 1, 10, a, dir)
          const inR = (rule.upper !== undefined && xbar >= rule.upper) || (rule.lower !== undefined && xbar <= rule.lower)
          const p = normalPValue(xbar, 0, 1, 10, dir)
          // 경계 근처 부동소수 오차 허용
          return inR === p <= a || Math.abs(p - a) < 1e-12
        },
      ),
      { numRuns: 500 },
    )
  })
})

describe('정규 모형 (T 시리즈)', () => {
  it('T02 예 7.1', () => {
    const rule = { upper: 2 }
    close(normalPower(rule, 0, 1, 1), golden.T02.c2.alpha)
    close(1 - normalPower(rule, 3, 1, 1), golden.T02.c2.beta)
    close(normalPower({ upper: 3 }, 0, 1, 1), golden.T02.c3.alpha)
  })
  it('T09·T11 크기와 검정력', () => {
    const two = normalAutoRule(0, 1, 10, 0.05, 'two')
    close(normalPower(two, 0, 1, 10), 0.05, 1e-12)
    close(normalPower(normalAutoRule(0, 1, 1, 0.05, 'R'), 1, 1, 1), golden.T11.n1)
    close(normalPower(normalAutoRule(0, 1, 10, 0.05, 'R'), 1, 1, 10), golden.T11.n10)
  })
  it('예 7.4 NP는 θ₁에 무관 (UMP)', () => {
    const a = normalNP(0, 0.5, 1, 10, 0.05)
    const b = normalNP(0, 2, 1, 10, 0.05)
    close(a.upper!, b.upper!)
    expect(normalNP(0, -1, 1, 10, 0.05).lower).toBeDefined()
  })
  it('표본크기 계획', () => {
    close(normalSampleSize(0.5, 1, 0.05, 0.8, 'R'), golden.sampleSize.d05oneSided80, 1e-9)
  })
})

describe('이산 확률표 (정확 산술)', () => {
  it('T05 교재 표 7.3', () => {
    const t = parseTable(['.10', '.20', '.25', '.10', '.35'], ['.25', '.15', '.20', '.10', '.30'])
    if (!t.ok) throw new Error(t.error)
    const np = tableNP(t.table, '0.15')
    expect(np.order).toEqual(golden.T05.order)
    expect(np.phi.map((f) => f.toNumber())).toEqual(golden.T05.phi)
    expect(np.size.toString()).toBe('3/20')
    expect(np.power.toString()).toBe('3/10')
  })
  it('T06 워크북', () => {
    const t = parseTable(['.4', '.3', '.2', '.1'], ['.2', '.2', '.3', '.3'])
    if (!t.ok) throw new Error(t.error)
    const s = tableSetSize(t.table, [2, 3])
    expect(s.size.toNumber()).toBeCloseTo(golden.T06.R23alpha, 12)
    expect(1 - s.power.toNumber()).toBeCloseTo(golden.T06.R23beta, 12)
    const best = tableBestNonRandomized(t.table, '0.1')
    expect(best.reject).toEqual(golden.T06.mpReject)
    expect(best.power.toNumber()).toBeCloseTo(golden.T06.mpPower, 12)
  })
  it('T07 기말 22~23 분수 그대로', () => {
    const t = parseTable(['9/27', '12/27', '5/27', '1/27'], ['2/27', '6/27', '12/27', '7/27'])
    if (!t.ok) throw new Error(t.error)
    const s = tableSetSize(t.table, [2, 3])
    expect(s.size.toString()).toBe('2/9')
    expect(Number(s.size.toNumber() * 27).toFixed(6)).toBe('6.000000')
    expect(s.power.toString()).toBe('19/27')
  })
  it('합이 1이 아니면 오류', () => {
    const t = parseTable(['.5', '.4'], ['.5', '.5'])
    expect(t.ok).toBe(false)
  })
})

describe('홍차', () => {
  it('T01', () => {
    expect(teaPmf().map((f) => f.toString())).toEqual(['1/70', '8/35', '18/35', '8/35', '1/70'])
    close(teaPValue(4).toNumber(), golden.T01.p4)
    close(teaPValue(3).toNumber(), golden.T01.p3)
  })
})
