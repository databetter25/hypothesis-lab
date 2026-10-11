import { describe, expect, it } from 'vitest'
import golden from '../golden/golden.json'
import { oneSampleT, parseData, tPdf, tPpfUpper, tSf, twoSampleT } from '../../src/engine/tdist'
import { normPpf } from '../../src/engine/core/normal'
import { simulate } from '../../src/engine/simulate'
import { wilson } from '../../src/engine/core/stats'

const rel = (a: number, b: number, tol = 1e-10) => expect(Math.abs(a - b)).toBeLessThan(tol * Math.max(1, Math.abs(b)))

describe('t분포', () => {
  it('상단 꼬리 (정수·비정수 자유도)', () => {
    for (const [x, v, p] of golden.T.sf) rel(tSf(x, v), p)
    for (const [x, v, p] of golden.T.sf) rel(tSf(-x, v), 1 - p)
  })
  it('밀도', () => {
    for (const [x, v, d] of golden.T.pdf) rel(tPdf(x, v), d)
  })
  it('상위 2.5% 분위수', () => {
    for (const [v, q] of golden.T.ppf975) rel(tPpfUpper(0.025, v), q, 1e-9)
  })
  it('프로그램 7.2: t통계량에 z 임계값을 쓰면 크기가 커진다', () => {
    for (const [v, p] of golden.T.zcritSize) rel(2 * tSf(normPpf(0.975), v), p)
    rel(2 * tSf(normPpf(0.975), 9), golden.T10.tWithZcrit)
  })
})

describe('한 표본 t (교재 예 7.7)', () => {
  it('통계량, p-값, 신뢰구간, −2 log Λ', () => {
    const r = oneSampleT(0.6, 1.2, 10, 0, 0.05, 'two')
    rel(r.t, golden.T.one.t)
    rel(r.p, golden.T.one.p)
    r.ci.forEach((v, i) => rel(v, golden.T.one.ci[i], 1e-9))
    rel(r.m2logL, golden.T.one.m2logL)
    expect(r.df).toBe(9)
  })
  it('쌍대성: μ₀가 구간 안 ⇔ 기각하지 못함', () => {
    for (const mu0 of [-1, -0.3, -0.25, 0, 0.5, 1.4, 1.5, 2]) {
      const r = oneSampleT(0.6, 1.2, 10, mu0, 0.05, 'two')
      expect(r.ci[0] < mu0 && mu0 < r.ci[1]).toBe(r.p > 0.05)
    }
  })
})

describe('두 표본 t (교재 예 7.8)', () => {
  it('합동분산 t와 Welch t', () => {
    const r = twoSampleT(5.2, 1.5, 12, 4.1, 2.0, 15, 0, 0.05, 'two')
    rel(r.pooled.t, golden.T.two.t)
    rel(r.pooled.p, golden.T.two.p)
    expect(r.pooled.df).toBe(golden.T.two.df)
    rel(r.welch.t, golden.T.two.welchT)
    rel(r.welch.df, golden.T.two.welchDf)
    rel(r.welch.p, golden.T.two.welchP, 1e-9)
  })
})

describe('자료 붙여넣기', () => {
  it('공백·쉼표·줄바꿈 구분', () => {
    const r = parseData('1, 2\n3 4;5')
    expect(r.ok && r.values).toEqual([1, 2, 3, 4, 5])
    if (r.ok) {
      rel(r.mean, 3)
      rel(r.sd, Math.sqrt(2.5))
    }
    expect(parseData('1, a').ok).toBe(false)
    expect(parseData('7').ok).toBe(false)
  })
})

describe('t 시뮬레이션', () => {
  it('프로그램 7.2 재현: H₀ 아래 t 임계값 ≈ 0.05, z 임계값 ≈ 0.0816', () => {
    const tc = tPpfUpper(0.025, 9)
    const zc = normPpf(0.975)
    const r = simulate({ model: 't1', n: 10, mu: 0, sigma: 1, theta0: 0, B: 20000, seed: 4, ruleA: { upper: tc, lower: -tc }, ruleB: { upper: zc, lower: -zc } })
    const [a0, a1] = wilson(r.rejects, r.B)
    const [b0, b1] = wilson(r.rejects2!, r.B)
    expect(a0 < 0.05 && 0.05 < a1).toBe(true)
    expect(b0 < golden.T10.tWithZcrit && golden.T10.tWithZcrit < b1).toBe(true)
  })
  it('두 표본: 같은 시드면 같은 결과, 합동·Welch 둘 다 계산', () => {
    const spec = { model: 't2' as const, n1: 10, n2: 40, mu1: 0, mu2: 0, s1: 3, s2: 1, delta0: 0, B: 2000, seed: 3, alpha: 0.05, dir: 'two' as const }
    const a = simulate(spec)
    expect(a.values).toEqual(simulate(spec).values)
    expect(a.values2!.length).toBe(2000)
    // 작은 표본의 분산이 크면 합동 t의 크기가 α보다 크게 부풀고, Welch는 α 근처
    expect(a.rejects / a.B).toBeGreaterThan(0.1)
    expect(Math.abs(a.rejects2! / a.B - 0.05)).toBeLessThan(0.02)
  })
})
