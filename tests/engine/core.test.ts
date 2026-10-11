import { describe, expect, it } from 'vitest'
import golden from '../golden/golden.json'
import { normCdf, normPpf, normSf } from '../../src/engine/core/normal'
import { Rng, deriveSeed } from '../../src/engine/core/rng'
import { Frac } from '../../src/engine/core/rational'
import { wilson } from '../../src/engine/core/stats'
import { logChoose } from '../../src/engine/core/logfact'

describe('정규분포', () => {
  it('Φ가 SciPy와 1e-12 이내로 일치', () => {
    for (const [z, p] of golden.normal.cdf) {
      const got = normCdf(z)
      expect(Math.abs(got - p)).toBeLessThan(1e-12 * Math.max(1, 1 / Math.max(p, 1e-300)) * p + 1e-15)
    }
  })
  it('꼬리 상대오차가 작다', () => {
    expect(normSf(8) / 6.22096057427178e-16).toBeCloseTo(1, 10)
  })
  it('Φ⁻¹가 SciPy와 1e-12 이내로 일치', () => {
    for (const [p, z] of golden.normal.ppf) {
      expect(Math.abs(normPpf(p) - z)).toBeLessThan(1e-12 * Math.max(1, Math.abs(z)))
    }
  })
})

describe('난수', () => {
  it('같은 시드면 같은 수열', () => {
    const a = new Rng(12345), b = new Rng(12345)
    for (let i = 0; i < 100; i++) expect(a.nextU32()).toBe(b.nextU32())
  })
  it('균등난수는 [0,1)이고 평균이 약 0.5', () => {
    const r = new Rng(7)
    let s = 0
    for (let i = 0; i < 100000; i++) {
      const u = r.next()
      expect(u).toBeGreaterThanOrEqual(0)
      expect(u).toBeLessThan(1)
      s += u
    }
    expect(Math.abs(s / 100000 - 0.5)).toBeLessThan(0.005)
  })
  it('하위 시드는 서로 다르다', () => {
    expect(deriveSeed(1, 0)).not.toBe(deriveSeed(1, 1))
  })
})

describe('유리수', () => {
  it('분수 파싱과 산술', () => {
    expect(Frac.parse('9/27').toString()).toBe('1/3')
    expect(Frac.parse('0.25').toString()).toBe('1/4')
    expect(Frac.parse('0.1').add(Frac.parse('0.2')).equals(Frac.parse('0.3'))).toBe(true)
    expect(Frac.parse('3/16').toNumber()).toBe(0.1875)
    expect(Frac.parse('1/2').cmp(Frac.parse('2/3'))).toBe(-1)
  })
  it('잘못된 입력은 null', () => {
    expect(Frac.tryParse('abc')).toBeNull()
    expect(Frac.tryParse('1/0')).toBeNull()
  })
})

describe('기타', () => {
  it('logChoose', () => {
    expect(Math.exp(logChoose(8, 4))).toBeCloseTo(70, 9)
  })
  it('Wilson 구간', () => {
    const [lo, hi] = wilson(500, 10000)
    expect(lo).toBeCloseTo(0.0458985, 6)
    expect(hi).toBeCloseTo(0.0544471, 6)
  })
})
