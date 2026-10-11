// χ²검정 (교재 7.4): 다항 적합도, 분할표 독립성. Pearson X²와 가능도비 G = −2 log Λ.
import { xlogy } from './core/stats'

/* ---------------- 감마·χ² 분포 ---------------- */

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
]

/** log Γ(x), x > 0 (Lanczos, g = 7) */
export function lgamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x)
  x -= 1
  let a = LANCZOS[0]
  const t = x + 7.5
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

/** 정규화 하측 불완전감마 P(a, x) */
function gammaPSeries(a: number, x: number): number {
  let sum = 1 / a
  let term = sum
  for (let n = 1; n < 1000; n++) {
    term *= x / (a + n)
    sum += term
    if (Math.abs(term) < Math.abs(sum) * 1e-16) break
  }
  return sum * Math.exp(-x + a * Math.log(x) - lgamma(a))
}

/** 정규화 상측 불완전감마 Q(a, x) — 연분수 (수정 Lentz) */
function gammaQCF(a: number, x: number): number {
  const tiny = 1e-300
  let b = x + 1 - a
  let c = 1 / tiny
  let d = 1 / b
  let h = d
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < tiny) d = tiny
    c = b + an / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-16) break
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h
}

export function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1
  return x < a + 1 ? 1 - gammaPSeries(a, x) : gammaQCF(a, x)
}

/** P(χ²_k > x) */
export function chi2Sf(x: number, k: number): number {
  if (x <= 0) return 1
  return gammaQ(k / 2, x / 2)
}

/** χ²_k 밀도 */
export function chi2Pdf(x: number, k: number): number {
  if (x < 0) return 0
  if (x === 0) return k === 2 ? 0.5 : k < 2 ? Infinity : 0
  return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lgamma(k / 2))
}

/** P(χ²_k > q) = α인 q (이분법 후 뉴턴 보정) */
export function chi2PpfUpper(alpha: number, k: number): number {
  let lo = 0
  let hi = Math.max(10, k * 4)
  while (chi2Sf(hi, k) > alpha) hi *= 2
  for (let i = 0; i < 200 && hi - lo > 1e-13 * hi; i++) {
    const mid = (lo + hi) / 2
    if (chi2Sf(mid, k) > alpha) lo = mid
    else hi = mid
  }
  let q = (lo + hi) / 2
  for (let i = 0; i < 3; i++) {
    const d = chi2Pdf(q, k)
    if (!(d > 0)) break
    q += (chi2Sf(q, k) - alpha) / d
  }
  return q
}

/* ---------------- 검정통계량 ---------------- */

export interface ChiResult {
  n: number
  /** 기대도수 (적합도: 1차원, 독립성: 행렬을 펼친 것) */
  Eflat: number[]
  Oflat: number[]
  X2: number
  G: number
  df: number
  pX2: number
  pG: number
  /** 칸별 (O−E)²/E */
  contrib: number[]
  /** 칸별 2·O·log(O/E) */
  gContrib: number[]
  minE: number
  smallCells: number
}

function stats(O: number[], E: number[], df: number): ChiResult {
  let X2 = 0
  let G = 0
  const contrib: number[] = []
  const gContrib: number[] = []
  for (let i = 0; i < O.length; i++) {
    const c = E[i] > 0 ? (O[i] - E[i]) ** 2 / E[i] : 0
    const g = O[i] > 0 ? 2 * (xlogy(O[i], O[i]) - xlogy(O[i], E[i])) : 0
    contrib.push(c)
    gContrib.push(g)
    X2 += c
    G += g
  }
  const pos = E.filter((e) => e > 0)
  return {
    n: O.reduce((a, b) => a + b, 0),
    Eflat: E,
    Oflat: O,
    X2,
    G,
    df,
    pX2: chi2Sf(X2, df),
    pG: chi2Sf(G, df),
    contrib,
    gContrib,
    minE: Math.min(...pos),
    smallCells: pos.filter((e) => e < 5).length,
  }
}

/** 적합도: H₀: (p₁,…,p_K) = p⁰. 추정 모수 없음 → df = K − 1 */
export function gofTest(O: number[], p0: number[]): ChiResult {
  const n = O.reduce((a, b) => a + b, 0)
  return stats(O, p0.map((p) => n * p), O.length - 1)
}

export interface IndepResult extends ChiResult {
  E: number[][]
  rowSums: number[]
  colSums: number[]
}

/** 독립성: E_ij = (행합 × 열합)/n, df = (r−1)(c−1) (교재 예 7.9) */
export function indepTest(table: number[][]): IndepResult {
  const r = table.length
  const c = table[0].length
  const rowSums = table.map((row) => row.reduce((a, b) => a + b, 0))
  const colSums = Array.from({ length: c }, (_, j) => table.reduce((a, row) => a + row[j], 0))
  const n = rowSums.reduce((a, b) => a + b, 0)
  const E = table.map((_, i) => colSums.map((cs) => (rowSums[i] * cs) / n))
  const res = stats(table.flat(), E.flat(), (r - 1) * (c - 1))
  return { ...res, E, rowSums, colSums }
}

/** 분할표 X²·G (시뮬레이션용, 할당 최소화) */
export function indepStat(counts: ArrayLike<number>, r: number, c: number): [number, number] {
  const rs = new Float64Array(r)
  const cs = new Float64Array(c)
  let n = 0
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++) {
      const v = counts[i * c + j]
      rs[i] += v
      cs[j] += v
      n += v
    }
  let X2 = 0
  let G = 0
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++) {
      const e = (rs[i] * cs[j]) / n
      if (e <= 0) continue
      const o = counts[i * c + j]
      X2 += (o - e) ** 2 / e
      if (o > 0) G += 2 * o * Math.log(o / e)
    }
  return [X2, G]
}

export function gofStat(counts: ArrayLike<number>, E: ArrayLike<number>): [number, number] {
  let X2 = 0
  let G = 0
  for (let i = 0; i < E.length; i++) {
    const o = counts[i]
    X2 += (o - E[i]) ** 2 / E[i]
    if (o > 0) G += 2 * o * Math.log(o / E[i])
  }
  return [X2, G]
}

/* ---------------- 입력 ---------------- */

/** "20,30,25/30,20,25" → [[20,30,25],[30,20,25]]. 음이 아닌 정수만 */
export function parseCountMatrix(s: string): { ok: true; rows: number[][] } | { ok: false; error: string } {
  const rows = s
    .trim()
    .split('/')
    .map((r) => r.split(',').map((v) => v.trim()))
  if (rows.length === 0 || rows[0].length === 0 || rows[0][0] === '') return { ok: false, error: '도수를 입력하세요.' }
  const c = rows[0].length
  const out: number[][] = []
  for (const r of rows) {
    if (r.length !== c) return { ok: false, error: '모든 행의 칸 수가 같아야 합니다.' }
    const nums = r.map(Number)
    if (nums.some((v) => !Number.isInteger(v) || v < 0)) return { ok: false, error: '도수는 0 이상의 정수여야 합니다.' }
    out.push(nums)
  }
  return { ok: true, rows: out }
}

/* ---------------- 적합도의 정확 계산 (다항 전수 계산) ---------------- */

export interface GofExact {
  /** X² > χ²_{K−1,α} 규칙의 정확한 크기 */
  sizeX2: number
  /** G > χ²_{K−1,α} 규칙의 정확한 크기 */
  sizeG: number
  /** 정확 p-값 P(X² ≥ 관측 X²) */
  pX2: number
  outcomes: number
}

/** 가능한 결과 수 C(n+K−1, K−1)가 limit 이하일 때만 계산한다 */
export function gofExact(n: number, p0: number[], alpha: number, x2obs: number, limit = 150000): GofExact | null {
  const K = p0.length
  const outcomes = Math.round(Math.exp(lgamma(n + K) - lgamma(n + 1) - lgamma(K)))
  if (!(outcomes <= limit)) return null
  const E = p0.map((p) => n * p)
  const crit = chi2PpfUpper(alpha, K - 1)
  const logp = p0.map(Math.log)
  const lf = Array.from({ length: n + 1 }, (_, k) => lgamma(k + 1))
  const base = lf[n]
  let sizeX2 = 0
  let sizeG = 0
  let pX2 = 0
  const tol = 1e-9 * Math.max(1, x2obs)
  const rec = (i: number, rem: number, logw: number, x2: number, g: number) => {
    if (i === K - 1) {
      const o = rem
      const lw = logw + (o > 0 ? o * logp[i] : 0) - lf[o]
      const X2 = x2 + (o - E[i]) ** 2 / E[i]
      const G = g + (o > 0 ? 2 * o * Math.log(o / E[i]) : 0)
      const pr = Math.exp(base + lw)
      if (X2 > crit) sizeX2 += pr
      if (G > crit) sizeG += pr
      if (X2 >= x2obs - tol) pX2 += pr
      return
    }
    for (let o = 0; o <= rem; o++) {
      rec(i + 1, rem - o, logw + (o > 0 ? o * logp[i] : 0) - lf[o], x2 + (o - E[i]) ** 2 / E[i], g + (o > 0 ? 2 * o * Math.log(o / E[i]) : 0))
    }
  }
  rec(0, n, 0, 0, 0)
  return { sizeX2, sizeG, pX2: Math.min(1, pX2), outcomes }
}
