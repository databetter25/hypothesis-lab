// t분포와 t검정 (교재 예 7.7 한 표본, 예 7.8 두 표본, 프로그램 7.2).
import { lgamma } from './chisq'
import { incBeta } from './ci'
import { normCdf, normSf } from './core/normal'
import type { NormalDir } from './normal'

/** P(T_ν > t) */
export function tSf(t: number, v: number): number {
  if (t === Infinity) return 0
  if (t === -Infinity) return 1
  const x = v / (v + t * t)
  const half = 0.5 * incBeta(v / 2, 0.5, x)
  return t >= 0 ? half : 1 - half
}

export function tCdf(t: number, v: number): number {
  return 1 - tSf(t, v)
}

export function tPdf(t: number, v: number): number {
  return Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2) - 0.5 * Math.log(v * Math.PI) - ((v + 1) / 2) * Math.log(1 + (t * t) / v))
}

/** P(T_ν > q) = p (0 < p < 0.5) */
export function tPpfUpper(p: number, v: number): number {
  let lo = 0
  let hi = 2
  while (tSf(hi, v) > p) hi *= 2
  for (let i = 0; i < 200 && hi - lo > 1e-14 * hi; i++) {
    const mid = (lo + hi) / 2
    if (tSf(mid, v) > p) lo = mid
    else hi = mid
  }
  let q = (lo + hi) / 2
  for (let i = 0; i < 2; i++) q += (tSf(q, v) - p) / tPdf(q, v)
  return q
}

/** t척도의 기각역: T ≥ upper 또는 T ≤ lower */
export interface TRule {
  upper?: number
  lower?: number
}

export function tRule(alpha: number, v: number, dir: NormalDir): TRule {
  if (dir === 'two') {
    const q = tPpfUpper(alpha / 2, v)
    return { upper: q, lower: -q }
  }
  const q = tPpfUpper(alpha, v)
  return dir === 'R' ? { upper: q } : { lower: -q }
}

function tP(t: number, v: number, dir: NormalDir): number {
  if (dir === 'R') return tSf(t, v)
  if (dir === 'L') return tCdf(t, v)
  return Math.min(1, 2 * tSf(Math.abs(t), v))
}

function zP(z: number, dir: NormalDir): number {
  if (dir === 'R') return normSf(z)
  if (dir === 'L') return normCdf(z)
  return 2 * normSf(Math.abs(z))
}

function ciFrom(center: number, se: number, alpha: number, v: number, dir: NormalDir): [number, number] {
  if (dir === 'two') {
    const q = tPpfUpper(alpha / 2, v)
    return [center - q * se, center + q * se]
  }
  const q = tPpfUpper(alpha, v)
  return dir === 'R' ? [center - q * se, Infinity] : [-Infinity, center + q * se]
}

export interface OneSampleT {
  t: number
  df: number
  p: number
  /** σ를 안다고 착각해 t를 N(0,1)과 비교한 p-값 (프로그램 7.2의 함정) */
  pZ: number
  rule: TRule
  ci: [number, number]
  se: number
  /** 예 7.7의 가능도비: −2 log Λ = n log(1 + t²/(n−1)) */
  m2logL: number
}

/** 한 표본 t: T = √n(x̄ − μ₀)/s ~ t(n − 1) */
export function oneSampleT(xbar: number, s: number, n: number, mu0: number, alpha: number, dir: NormalDir): OneSampleT {
  const df = n - 1
  const se = s / Math.sqrt(n)
  const t = (xbar - mu0) / se
  return {
    t,
    df,
    p: tP(t, df, dir),
    pZ: zP(t, dir),
    rule: tRule(alpha, df, dir),
    ci: ciFrom(xbar, se, alpha, df, dir),
    se,
    m2logL: n * Math.log(1 + (t * t) / df),
  }
}

export interface TwoSampleT {
  pooled: { t: number; df: number; p: number; sp: number; se: number; ci: [number, number] }
  welch: { t: number; df: number; p: number; se: number; ci: [number, number] }
}

/** 두 표본 t: 합동분산(교재 예 7.8)과 Welch–Satterthwaite */
export function twoSampleT(x1: number, s1: number, n1: number, x2: number, s2: number, n2: number, delta0: number, alpha: number, dir: NormalDir): TwoSampleT {
  const diff = x1 - x2
  const df = n1 + n2 - 2
  const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / df)
  const seP = sp * Math.sqrt(1 / n1 + 1 / n2)
  const tP0 = (diff - delta0) / seP
  const v1 = (s1 * s1) / n1
  const v2 = (s2 * s2) / n2
  const seW = Math.sqrt(v1 + v2)
  const dfW = (v1 + v2) ** 2 / ((v1 * v1) / (n1 - 1) + (v2 * v2) / (n2 - 1))
  const tW = (diff - delta0) / seW
  return {
    pooled: { t: tP0, df, p: tP(tP0, df, dir), sp, se: seP, ci: ciFrom(diff, seP, alpha, df, dir) },
    welch: { t: tW, df: dfW, p: tP(tW, dfW, dir), se: seW, ci: ciFrom(diff, seW, alpha, dfW, dir) },
  }
}

/** Welch 판정용 p-값 (시뮬레이션에서 반복마다 호출) */
export function tPValue(t: number, v: number, dir: NormalDir): number {
  return tP(t, v, dir)
}

/** 자료 붙여넣기: 공백·쉼표·세미콜론·줄바꿈 구분, 2개 이상 */
export function parseData(text: string): { ok: true; values: number[]; mean: number; sd: number } | { ok: false; error: string } {
  const toks = text
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean)
  const values = toks.map(Number)
  if (values.some((v) => !Number.isFinite(v))) return { ok: false, error: '숫자가 아닌 값이 있습니다.' }
  if (values.length < 2) return { ok: false, error: '자료는 2개 이상이어야 합니다.' }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1))
  return { ok: true, values, mean, sd }
}
