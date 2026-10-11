// 포아송 평균(교재 예 7.3)과 정규 분산(교재 예 7.5)의 최강력검정. PRD F17.
import { chi2Pdf, chi2PpfUpper, chi2Sf, lgamma } from './chisq'
import { npRandomized, type NPResult } from './discrete'

/* ---------------- 포아송: T = ΣXᵢ ~ Poisson(nθ) ---------------- */

export function poisLogPmf(t: number, lam: number): number {
  if (lam === 0) return t === 0 ? 0 : -Infinity
  return t * Math.log(lam) - lam - lgamma(t + 1)
}

/** 0..tMax의 pmf. 마지막 칸은 꼬리 P(T ≥ tMax)를 흡수해 합이 1이 되게 한다 */
export function poisTable(lam: number, tMax: number): Float64Array {
  const f = new Float64Array(tMax + 1)
  let s = 0
  for (let t = 0; t < tMax; t++) s += f[t] = Math.exp(poisLogPmf(t, lam))
  f[tMax] = Math.max(0, 1 - s)
  return f
}

/** 두 평균 모두에서 꼬리확률이 1e-12 미만이 되는 상한 */
export function poisTMax(...lams: number[]): number {
  const L = Math.max(...lams)
  let t = Math.ceil(L + 10 * Math.sqrt(L + 1) + 10)
  while (Math.exp(poisLogPmf(t, L)) > 1e-14) t += 5
  return t
}

export interface PoisMP {
  tMax: number
  f0: Float64Array
  f1: Float64Array
  /** 비확률화 최강력: θ₁ < θ₀이면 T ≤ c, θ₁ > θ₀이면 T ≥ c */
  side: 'L' | 'R'
  c: number
  phi: Float64Array
  size: number
  power: number
  /** 확률화 최강력 (크기 = α) */
  np: NPResult
  npPower: number
}

export function poisMP(n: number, theta0: number, theta1: number, alpha: number): PoisMP {
  const lam0 = n * theta0
  const lam1 = n * theta1
  const tMax = poisTMax(lam0, lam1)
  const f0 = poisTable(lam0, tMax)
  const f1 = poisTable(lam1, tMax)
  const side: 'L' | 'R' = theta1 < theta0 ? 'L' : 'R'
  const phi = new Float64Array(tMax + 1)
  let c: number
  if (side === 'L') {
    c = -1
    let acc = 0
    for (let t = 0; t <= tMax; t++) {
      if (acc + f0[t] > alpha) break
      acc += f0[t]
      c = t
    }
    for (let t = 0; t <= c; t++) phi[t] = 1
  } else {
    c = tMax + 1
    let acc = 0
    for (let t = tMax; t >= 0; t--) {
      if (acc + f0[t] > alpha) break
      acc += f0[t]
      c = t
    }
    for (let t = c; t <= tMax; t++) phi[t] = 1
  }
  let size = 0
  let power = 0
  for (let t = 0; t <= tMax; t++) {
    size += phi[t] * f0[t]
    power += phi[t] * f1[t]
  }
  // 가능도비 log f₁/f₀ = t log(θ₁/θ₀) − n(θ₁ − θ₀): t의 단조함수 (교재 예 7.3)
  const logRatio = Float64Array.from({ length: tMax + 1 }, (_, t) => t * Math.log(theta1 / theta0) - n * (theta1 - theta0))
  const np = npRandomized(f0, f1, alpha, logRatio)
  let npPower = 0
  for (let t = 0; t <= tMax; t++) npPower += np.phi[t] * f1[t]
  return { tMax, f0, f1, side, c, phi, size, power, np, npPower }
}

/** 관측 합계 t의 p-값 (대립 방향 쪽 꼬리) */
export function poisPValue(t: number, n: number, theta0: number, side: 'L' | 'R'): number {
  const lam = n * theta0
  const tMax = poisTMax(lam, t + 1)
  const f = poisTable(lam, tMax)
  let s = 0
  if (side === 'L') for (let u = 0; u <= t; u++) s += f[u]
  else for (let u = tMax; u >= t; u--) s += f[u]
  return Math.min(1, s)
}

/* ---------------- 정규 분산 (μ 기지): W = Σ(Xᵢ − μ)²/σ₀² ~ χ²(n) ---------------- */

export interface NVarMP {
  side: 'L' | 'R'
  /** W 척도의 임계값: R이면 W ≥ c, L이면 W ≤ c */
  c: number
  size: number
  /** σ = σ₁에서의 검정력 */
  power: number
}

export function nvarMP(n: number, sigma0: number, sigma1: number, alpha: number): NVarMP {
  const r = (sigma0 * sigma0) / (sigma1 * sigma1)
  if (sigma1 > sigma0) {
    const c = chi2PpfUpper(alpha, n)
    return { side: 'R', c, size: alpha, power: chi2Sf(c * r, n) }
  }
  const c = chi2PpfUpper(1 - alpha, n)
  return { side: 'L', c, size: alpha, power: 1 - chi2Sf(c * r, n) }
}

/** σ에서의 검정력 함수 */
export function nvarPower(rule: NVarMP, sigma0: number, sigma: number, n: number): number {
  const r = (sigma0 * sigma0) / (sigma * sigma)
  return rule.side === 'R' ? chi2Sf(rule.c * r, n) : 1 - chi2Sf(rule.c * r, n)
}

/** σ가 참일 때 W = Σ(Xᵢ−μ)²/σ₀²의 밀도: (σ²/σ₀²)·χ²(n) */
export function nvarDensity(w: number, n: number, sigma0: number, sigma: number): number {
  const r = (sigma0 * sigma0) / (sigma * sigma)
  return r * chi2Pdf(w * r, n)
}

export function nvarPValue(w: number, n: number, side: 'L' | 'R'): number {
  return side === 'R' ? chi2Sf(w, n) : 1 - chi2Sf(w, n)
}
