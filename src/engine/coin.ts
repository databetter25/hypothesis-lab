// M1 동전: X ~ B(n, θ). PRD v3 §11.2, §11.5.
import { logChoose } from './core/logfact'
import { chi2Ppf1Upper } from './core/normal'
import { xlogy } from './core/stats'
import { nearlyEqual } from './discrete'

export type OneSidedDir = 'R' | 'L'
export type CoinPDir = OneSidedDir | 'two-tail' | 'two-lrt'

export function coinLogPmf(n: number, theta: number): Float64Array {
  const out = new Float64Array(n + 1)
  for (let x = 0; x <= n; x++) out[x] = logChoose(n, x) + xlogy(x, theta) + xlogy(n - x, 1 - theta)
  return out
}

export function coinPmf(n: number, theta: number): Float64Array {
  return coinLogPmf(n, theta).map(Math.exp)
}

/** P(X ≥ x): 먼 꼬리(n)부터 더해 작은 항이 먼저 더해지게 한다 */
export function upperTail(f: ArrayLike<number>, x: number): number {
  let s = 0
  for (let u = f.length - 1; u >= Math.max(x, 0); u--) s += f[u]
  return s
}

/** P(X ≤ x) */
export function lowerTail(f: ArrayLike<number>, x: number): number {
  let s = 0
  for (let u = 0; u <= Math.min(x, f.length - 1); u++) s += f[u]
  return s
}

export function coinPValue(n: number, theta0: number, x: number, dir: CoinPDir): number {
  if (dir === 'two-lrt') return coinLrtPValue(n, theta0, x)
  const f = coinPmf(n, theta0)
  if (dir === 'R') return upperTail(f, x)
  if (dir === 'L') return lowerTail(f, x)
  return Math.min(1, 2 * Math.min(upperTail(f, x), lowerTail(f, x)))
}

export interface CoinRule {
  phi: Float64Array
  /** 우측: X ≥ c (c = n+1이면 기각 없음). 좌측: X ≤ c (c = −1이면 기각 없음) */
  c: number
  size: number
  /** 한 칸 더 넓힌 규칙의 크기 */
  nextSize: number | null
}

/** α로 정한 비확률화 단측 규칙 (PRD §11.2) */
export function coinAutoRule(n: number, theta0: number, alpha: number, dir: OneSidedDir): CoinRule {
  const f = coinPmf(n, theta0)
  const phi = new Float64Array(n + 1)
  if (dir === 'R') {
    let c = n + 1
    let size = 0
    while (c - 1 >= 0) {
      const t = upperTail(f, c - 1)
      if (t > alpha) break
      c--
      size = t
    }
    for (let x = c; x <= n; x++) phi[x] = 1
    return { phi, c, size, nextSize: c - 1 >= 0 ? upperTail(f, c - 1) : null }
  }
  let c = -1
  let size = 0
  while (c + 1 <= n) {
    const t = lowerTail(f, c + 1)
    if (t > alpha) break
    c++
    size = t
  }
  for (let x = 0; x <= c; x++) phi[x] = 1
  return { phi, c, size, nextSize: c + 1 <= n ? lowerTail(f, c + 1) : null }
}

/** 수동 임계값 규칙 */
export function coinManualRule(n: number, c: number, dir: OneSidedDir): Float64Array {
  const phi = new Float64Array(n + 1)
  for (let x = 0; x <= n; x++) phi[x] = (dir === 'R' ? x >= c : x <= c) ? 1 : 0
  return phi
}

/** 가능도비 f₁/f₀의 로그 (언더플로 없음) */
export function coinLogRatio(n: number, theta0: number, theta1: number): Float64Array {
  const out = new Float64Array(n + 1)
  for (let x = 0; x <= n; x++) {
    out[x] = xlogy(x, theta1) - xlogy(x, theta0) + xlogy(n - x, 1 - theta1) - xlogy(n - x, 1 - theta0)
  }
  return out
}

/** log Λ(x) = log f(x|θ₀) − log f(x|θ̂), θ̂ = x/n. 항상 ≤ 0 */
export function coinLogLambda(n: number, theta0: number): Float64Array {
  const out = new Float64Array(n + 1)
  for (let x = 0; x <= n; x++) {
    const th = x / n
    out[x] = xlogy(x, theta0) + xlogy(n - x, 1 - theta0) - xlogy(x, th) - xlogy(n - x, 1 - th)
  }
  return out
}

/** p-값 B: Λ가 관측값 이하인 결과의 귀무 확률 합 */
export function coinLrtPValue(n: number, theta0: number, x: number): number {
  const ll = coinLogLambda(n, theta0)
  const f = coinPmf(n, theta0)
  const l0 = ll[x]
  let s = 0
  for (let u = 0; u <= n; u++) if (ll[u] <= l0 || nearlyEqual(ll[u], l0)) s += f[u]
  return Math.min(1, s)
}

/** 비확률화 LRT 규칙: {log Λ ≤ k} 중 크기 ≤ α인 가장 큰 집합 */
export function coinLrtRule(n: number, theta0: number, alpha: number): { phi: Float64Array; size: number } {
  const ll = coinLogLambda(n, theta0)
  const f = coinPmf(n, theta0)
  const levels = [...ll].sort((a, b) => a - b)
  let best = new Float64Array(n + 1)
  let bestSize = 0
  for (const k of levels) {
    const phi = new Float64Array(n + 1)
    let s = 0
    for (let u = 0; u <= n; u++) {
      if (ll[u] <= k || nearlyEqual(ll[u], k)) {
        phi[u] = 1
        s += f[u]
      }
    }
    if (s <= alpha) {
      best = phi
      bestSize = s
    } else break
  }
  return { phi: best, size: bestSize }
}

/** −2 log Λ > χ²₁,α 규칙의 정확한 크기 (Wilks 근사 점검) */
export function coinWilksSize(n: number, theta0: number, alpha: number): number {
  const crit = chi2Ppf1Upper(alpha)
  const ll = coinLogLambda(n, theta0)
  const f = coinPmf(n, theta0)
  let s = 0
  for (let x = 0; x <= n; x++) if (-2 * ll[x] > crit) s += f[x]
  return s
}

/** θ 격자에서 π(θ) 곡선 */
export function coinPowerCurve(phi: ArrayLike<number>, n: number, grid: number[]): number[] {
  return grid.map((th) => {
    const f = coinPmf(n, th)
    let s = 0
    for (let x = 0; x <= n; x++) s += phi[x] * f[x]
    return s
  })
}
