// 신뢰구간과 검정의 쌍대성 (교재 8.6~8.7, 식 8.54~8.61).
// 신뢰구간 C(x) = { θ₀ : x ∈ A(θ₀) } = H₀: θ = θ₀를 기각하지 못하는 θ₀의 집합.
import { lgamma } from './chisq'
import { coinPmf } from './coin'
import { normCdf, normPpf, normSf } from './core/normal'
import { stdErr, type NormalDir } from './normal'

/* ---------------- 정규화 불완전 베타 I_x(a, b) ---------------- */

function betacf(a: number, b: number, x: number): number {
  const tiny = 1e-300
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < tiny) d = tiny
  d = 1 / d
  let h = d
  for (let m = 1; m < 500; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < tiny) d = tiny
    c = 1 + aa / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < tiny) d = tiny
    c = 1 + aa / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-16) break
  }
  return h
}

/** I_x(a, b) */
export function incBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const lbt = lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  const bt = Math.exp(lbt)
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b
}

/** 증가함수 f에 대해 f(θ) = target인 θ ∈ [0, 1] (이분법) */
function solveIncreasing(f: (t: number) => number, target: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (f(mid) < target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/* ---------------- 동전: 세 가지 구간과 그 구간이 뒤집는 검정 ---------------- */

export type CIMethod = 'cp' | 'wilson' | 'wald'

export const CI_METHODS: { id: CIMethod; label: string; test: string; color: string }[] = [
  { id: 'cp', label: 'Clopper–Pearson (정확)', test: '이항 정확 검정 (양 꼬리 각 α/2)', color: 'var(--c-blue)' },
  { id: 'wilson', label: 'Wilson (점수)', test: '점수검정 z = (x − nθ₀)/√(nθ₀(1−θ₀)) — χ²검정(K = 2)과 같음', color: '#1a7f37' },
  { id: 'wald', label: 'Wald (교재 정리 8.8)', test: 'Wald 검정 z = (θ̂ − θ₀)/√(θ̂(1−θ̂)/n)', color: 'var(--c-alt)' },
]

/** P_θ(X ≥ x) = I_θ(x, n − x + 1), P_θ(X ≤ x) = 1 − I_θ(x + 1, n − x) */
const upperTailTheta = (x: number, n: number, t: number) => (x <= 0 ? 1 : incBeta(x, n - x + 1, t))
const lowerTailTheta = (x: number, n: number, t: number) => (x >= n ? 1 : 1 - incBeta(x + 1, n - x, t))

export function coinCI(x: number, n: number, alpha: number, method: CIMethod): [number, number] {
  const z = normPpf(1 - alpha / 2)
  const ph = x / n
  if (method === 'wald') {
    const h = z * Math.sqrt((ph * (1 - ph)) / n)
    return [ph - h, ph + h]
  }
  if (method === 'wilson') {
    const d = 1 + (z * z) / n
    const c = (ph + (z * z) / (2 * n)) / d
    const h = (z * Math.sqrt((ph * (1 - ph)) / n + (z * z) / (4 * n * n))) / d
    return [c - h, c + h]
  }
  const lo = x === 0 ? 0 : solveIncreasing((t) => upperTailTheta(x, n, t), alpha / 2)
  const hi = x === n ? 1 : solveIncreasing((t) => -lowerTailTheta(x, n, t), -alpha / 2)
  return [lo, hi]
}

/** 각 방법이 뒤집는 양측 검정의 p-값 함수 θ₀ ↦ p(θ₀) */
export function coinPFunction(x: number, n: number, theta0: number, method: CIMethod): number {
  if (method === 'cp') {
    if (theta0 <= 0) return x === 0 ? 1 : 0
    if (theta0 >= 1) return x === n ? 1 : 0
    return Math.min(1, 2 * Math.min(upperTailTheta(x, n, theta0), lowerTailTheta(x, n, theta0)))
  }
  if (method === 'wilson') {
    const v = n * theta0 * (1 - theta0)
    if (v <= 0) return (theta0 <= 0 && x === 0) || (theta0 >= 1 && x === n) ? 1 : 0
    return 2 * normSf(Math.abs(x - n * theta0) / Math.sqrt(v))
  }
  const ph = x / n
  const se = Math.sqrt((ph * (1 - ph)) / n)
  if (se === 0) return Math.abs(theta0 - ph) < 1e-12 ? 1 : 0
  return 2 * normSf(Math.abs(ph - theta0) / se)
}

/** 참값 θ*에서의 정확한 포함확률 Σ f(x|θ*) 1[θ* ∈ C(x)] */
export function coinCoverage(n: number, thetaStar: number, alpha: number, method: CIMethod, cis?: [number, number][]): number {
  const f = coinPmf(n, thetaStar)
  const table = cis ?? Array.from({ length: n + 1 }, (_, x) => coinCI(x, n, alpha, method))
  let s = 0
  for (let x = 0; x <= n; x++) if (table[x][0] <= thetaStar && thetaStar <= table[x][1]) s += f[x]
  return s
}

/** 수용역 A(θ₀) = 기각하지 못하는 x들 (CP: 양 꼬리 각 α/2) */
export function coinAcceptance(n: number, theta0: number, alpha: number, method: CIMethod): boolean[] {
  return Array.from({ length: n + 1 }, (_, x) => coinPFunction(x, n, theta0, method) > alpha)
}

/* ---------------- 정규 평균 (σ 기지) ---------------- */

/** 우측 대립(H₁: θ > θ₀)을 뒤집으면 하한만 있는 구간, 좌측이면 상한만 */
export function normalCI(xbar: number, sigma: number, n: number, alpha: number, dir: NormalDir): [number, number] {
  const se = stdErr(sigma, n)
  if (dir === 'two') {
    const z = normPpf(1 - alpha / 2)
    return [xbar - z * se, xbar + z * se]
  }
  const z = normPpf(1 - alpha)
  return dir === 'R' ? [xbar - z * se, Infinity] : [-Infinity, xbar + z * se]
}

export function normalPFunction(xbar: number, sigma: number, n: number, theta0: number, dir: NormalDir): number {
  const z = (xbar - theta0) / stdErr(sigma, n)
  if (dir === 'R') return normSf(z)
  if (dir === 'L') return normCdf(z)
  return 2 * normSf(Math.abs(z))
}

