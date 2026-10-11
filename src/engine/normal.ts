// M2 정규 평균 (σ 기지): X̄ ~ N(θ, σ²/n). PRD v3 §11.3.
import { normCdf, normPpf, normSf } from './core/normal'

export type NormalDir = 'R' | 'L' | 'two'

/** X̄ 척도의 기각역: X̄ ≥ upper 또는 X̄ ≤ lower */
export interface NormalRule {
  upper?: number
  lower?: number
}

export const stdErr = (sigma: number, n: number) => sigma / Math.sqrt(n)

export function zStat(xbar: number, theta0: number, sigma: number, n: number): number {
  return (xbar - theta0) / stdErr(sigma, n)
}

export function normalAutoRule(theta0: number, sigma: number, n: number, alpha: number, dir: NormalDir): NormalRule {
  const se = stdErr(sigma, n)
  if (dir === 'R') return { upper: theta0 + normPpf(1 - alpha) * se }
  if (dir === 'L') return { lower: theta0 - normPpf(1 - alpha) * se }
  const z = normPpf(1 - alpha / 2)
  return { upper: theta0 + z * se, lower: theta0 - z * se }
}

/** π(θ) = P(X̄ ∈ R | θ) */
export function normalPower(rule: NormalRule, theta: number, sigma: number, n: number): number {
  const se = stdErr(sigma, n)
  let p = 0
  if (rule.upper !== undefined) p += normSf((rule.upper - theta) / se)
  if (rule.lower !== undefined) p += normCdf((rule.lower - theta) / se)
  return p
}

export function normalPValue(xbar: number, theta0: number, sigma: number, n: number, dir: NormalDir): number {
  const z = zStat(xbar, theta0, sigma, n)
  if (dir === 'R') return normSf(z)
  if (dir === 'L') return normCdf(z)
  return Math.min(1, 2 * normSf(Math.abs(z)))
}

/** 예 7.4: 단순 대 단순 최강력. θ₁ > θ₀이면 우측, 아니면 좌측. 기각역은 θ₁에 무관(UMP) */
export function normalNP(theta0: number, theta1: number, sigma: number, n: number, alpha: number): NormalRule {
  return normalAutoRule(theta0, sigma, n, alpha, theta1 > theta0 ? 'R' : 'L')
}

/** 목표 검정력에 필요한 n (연속값). 양측은 반대 꼬리를 무시한 근사 */
export function normalSampleSize(diff: number, sigma: number, alpha: number, power: number, dir: NormalDir): number {
  const za = dir === 'two' ? normPpf(1 - alpha / 2) : normPpf(1 - alpha)
  const zb = normPpf(power)
  return (((za + zb) * sigma) / Math.abs(diff)) ** 2
}

/** −2 log Λ = n(x̄ − θ₀)²/σ² = Z² (예 7.6, 연습문제 07) */
export function normalMinus2LogLambda(xbar: number, theta0: number, sigma: number, n: number): number {
  const z = zStat(xbar, theta0, sigma, n)
  return z * z
}

/** H₀ 아래 p-값 분포는 U(0,1). θ* 아래 우측 기준 P(p ≤ u) */
export function normalPValueCdf(u: number, theta0: number, thetaStar: number, sigma: number, n: number, dir: NormalDir): number {
  if (u <= 0) return 0
  if (u >= 1) return 1
  const rule = normalAutoRule(theta0, sigma, n, u, dir)
  return normalPower(rule, thetaStar, sigma, n)
}
