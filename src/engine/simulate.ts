// 반복 실험. 결정적이며 부수효과가 없다 (Worker 안팎 어디서든 실행 가능).
// 난수 소비 순서 (PRD §11.7): 반복마다 표본 난수 → 확률화용 v 1개(항상).
import { RNG_ID, Rng } from './core/rng'
import type { NormalDir, NormalRule } from './normal'
import { tPValue, tRule, type TRule } from './tdist'
import { teaGuess } from './tea'
import { gofStat, indepStat } from './chisq'
import { MULTI_METHODS, multiReject } from './pitfalls'
import { normSf } from './core/normal'

export type SimSpec =
  | { model: 'coin'; n: number; theta: number; B: number; seed: number; phi: number[] }
  | { model: 'normal'; n: number; theta: number; sigma: number; B: number; seed: number; rule: NormalRule }
  | { model: 'table'; probs: number[]; B: number; seed: number; phi: number[] }
  | { model: 'tea'; B: number; seed: number; phi: number[] }
  /** 다항 표본에서 X²(values)와 G(values2)를 계산. shape가 있으면 분할표 독립성, 없으면 적합도 */
  | { model: 'multinomial'; probs: number[]; n: number; B: number; seed: number; shape: [number, number] | null; crit: number }
  /** 한 표본 t: values = T, rejects = 규칙 A(t 임계값), rejects2 = 규칙 B(z 임계값) */
  | { model: 't1'; n: number; mu: number; sigma: number; theta0: number; B: number; seed: number; ruleA: TRule; ruleB: TRule }
  /** 두 표본: values = 합동 t, values2 = Welch t, rejects = 합동, rejects2 = Welch */
  /** 선택적 중단: 엿보기마다 bounds[k] = [lo, hi]로 판정, 기각하면 멈춤. counts[k] = k번째 엿보기에서 멈춘 수, 마지막 칸 = 끝까지 못 멈춤 */
  | { model: 'seq'; theta: number; looks: number[]; bounds: [number, number][]; B: number; seed: number }
  /** 다중검정: 독립 단측 z검정 m개(참인 귀무 m0개). extra에 방법별 FWER 횟수·FDP 합·검정력 합 */
  | { model: 'multi'; m: number; m0: number; delta: number; alpha: number; B: number; seed: number }
  /** 정규 분산(μ 기지): values = W = Σ(Xᵢ−μ)²/σ₀², W ≥ upper 또는 W ≤ lower이면 기각 */
  | { model: 'nvar'; n: number; mu: number; sigma: number; sigma0: number; B: number; seed: number; upper?: number; lower?: number }
  | { model: 't2'; n1: number; n2: number; mu1: number; mu2: number; s1: number; s2: number; delta0: number; B: number; seed: number; alpha: number; dir: NormalDir }

export interface SimResult {
  /** 이산 통계량의 값별 빈도 (coin: 0..n, table: 0..K-1, tea: 0..4) */
  counts: number[] | null
  /** 정규 모형의 X̄ 값들, 다항 모형의 X² 값들 */
  values: Float64Array | null
  /** 다항 모형의 G = −2 log Λ 값들 */
  values2?: Float64Array | null
  rejects: number
  /** 두 번째 규칙의 기각 수 (t 모형) */
  rejects2?: number
  /** 모형별 추가 집계 (다중검정) */
  extra?: Record<string, number>
  B: number
  meta: { rngId: string; seed: number; model: string }
}

export const APP_SIM_VERSION = 1

export function simulate(spec: SimSpec, onProgress?: (done: number) => void, chunk = 500): SimResult {
  const rng = new Rng(spec.seed)
  const meta = { rngId: RNG_ID, seed: spec.seed, model: spec.model }
  let rejects = 0

  if (spec.model === 'normal') {
    const values = new Float64Array(spec.B)
    const { upper, lower } = spec.rule
    for (let b = 0; b < spec.B; b++) {
      let s = 0
      for (let i = 0; i < spec.n; i++) s += spec.theta + spec.sigma * rng.normal()
      const xbar = s / spec.n
      rng.next() // 확률화용 v (정규 모형에서는 쓰지 않지만 소비 순서 고정)
      values[b] = xbar
      if ((upper !== undefined && xbar >= upper) || (lower !== undefined && xbar <= lower)) rejects++
      if (onProgress && (b + 1) % chunk === 0) onProgress(b + 1)
    }
    return { counts: null, values, rejects, B: spec.B, meta }
  }

  if (spec.model === 'nvar') {
    const values = new Float64Array(spec.B)
    const s0 = spec.sigma0 * spec.sigma0
    for (let b = 0; b < spec.B; b++) {
      let w = 0
      for (let i = 0; i < spec.n; i++) {
        const x = spec.mu + spec.sigma * rng.normal()
        w += (x - spec.mu) ** 2
      }
      rng.next() // 확률화용 v (소비 순서 고정)
      w /= s0
      values[b] = w
      if ((spec.upper !== undefined && w >= spec.upper) || (spec.lower !== undefined && w <= spec.lower)) rejects++
      if (onProgress && (b + 1) % chunk === 0) onProgress(b + 1)
    }
    return { counts: null, values, rejects, B: spec.B, meta }
  }

  if (spec.model === 'seq') {
    const nMax = spec.looks[spec.looks.length - 1]
    const lookIdx = new Map(spec.looks.map((n, i) => [n, i]))
    const counts = new Array<number>(spec.looks.length + 1).fill(0)
    for (let b = 0; b < spec.B; b++) {
      let x = 0
      let stopped = -1
      // 소비 순서 고정: 멈춰도 n_max개의 난수를 모두 뽑는다
      for (let n = 1; n <= nMax; n++) {
        if (rng.next() < spec.theta) x++
        if (stopped < 0) {
          const k = lookIdx.get(n)
          if (k !== undefined && (x <= spec.bounds[k][0] || x >= spec.bounds[k][1])) stopped = k
        }
      }
      rng.next()
      if (stopped >= 0) {
        counts[stopped]++
        rejects++
      } else counts[spec.looks.length]++
      if (onProgress && (b + 1) % chunk === 0) onProgress(b + 1)
    }
    return { counts, values: null, rejects, B: spec.B, meta }
  }

  if (spec.model === 'multi') {
    const extra: Record<string, number> = {}
    for (const mm of MULTI_METHODS) extra[`${mm.id}_fwer`] = extra[`${mm.id}_fdp`] = extra[`${mm.id}_pow`] = 0
    const p = new Float64Array(spec.m)
    const m1 = spec.m - spec.m0
    for (let b = 0; b < spec.B; b++) {
      // 앞의 m0개가 참인 귀무, 나머지는 평균 δ인 대립
      for (let i = 0; i < spec.m; i++) p[i] = normSf(rng.normal() + (i < spec.m0 ? 0 : spec.delta))
      rng.next()
      for (const mm of MULTI_METHODS) {
        const rej = multiReject(p, spec.alpha, mm.id)
        let V = 0
        let S = 0
        for (let i = 0; i < spec.m; i++) if (rej[i]) i < spec.m0 ? V++ : S++
        if (V > 0) extra[`${mm.id}_fwer`]++
        if (V + S > 0) extra[`${mm.id}_fdp`] += V / (V + S)
        if (m1 > 0) extra[`${mm.id}_pow`] += S / m1
      }
      if (onProgress && (b + 1) % chunk === 0) onProgress(b + 1)
    }
    return { counts: null, values: null, rejects: extra.none_fwer, B: spec.B, meta, extra }
  }

  if (spec.model === 't1') {
    const values = new Float64Array(spec.B)
    let rej2 = 0
    const inR = (r: TRule, t: number) => (r.upper !== undefined && t >= r.upper) || (r.lower !== undefined && t <= r.lower)
    for (let b = 0; b < spec.B; b++) {
      let sum = 0
      let sq = 0
      const xs = new Float64Array(spec.n)
      for (let i = 0; i < spec.n; i++) {
        xs[i] = spec.mu + spec.sigma * rng.normal()
        sum += xs[i]
      }
      rng.next() // 확률화용 v (소비 순서 고정)
      const m = sum / spec.n
      for (let i = 0; i < spec.n; i++) sq += (xs[i] - m) ** 2
      const t = (m - spec.theta0) / Math.sqrt(sq / (spec.n - 1) / spec.n)
      values[b] = t
      if (inR(spec.ruleA, t)) rejects++
      if (inR(spec.ruleB, t)) rej2++
      if (onProgress && (b + 1) % chunk === 0) onProgress(b + 1)
    }
    return { counts: null, values, rejects, rejects2: rej2, B: spec.B, meta }
  }

  if (spec.model === 't2') {
    const values = new Float64Array(spec.B)
    const values2 = new Float64Array(spec.B)
    const df = spec.n1 + spec.n2 - 2
    const rule = tRule(spec.alpha, df, spec.dir)
    let rej2 = 0
    const draw = (n: number, mu: number, s: number) => {
      let sum = 0
      const xs = new Float64Array(n)
      for (let i = 0; i < n; i++) {
        xs[i] = mu + s * rng.normal()
        sum += xs[i]
      }
      const m = sum / n
      let sq = 0
      for (let i = 0; i < n; i++) sq += (xs[i] - m) ** 2
      return [m, sq / (n - 1)] as const
    }
    for (let b = 0; b < spec.B; b++) {
      const [m1, v1] = draw(spec.n1, spec.mu1, spec.s1)
      const [m2, v2] = draw(spec.n2, spec.mu2, spec.s2)
      rng.next() // 확률화용 v (소비 순서 고정)
      const sp2 = ((spec.n1 - 1) * v1 + (spec.n2 - 1) * v2) / df
      const tp = (m1 - m2 - spec.delta0) / Math.sqrt(sp2 * (1 / spec.n1 + 1 / spec.n2))
      const a = v1 / spec.n1
      const c = v2 / spec.n2
      const tw = (m1 - m2 - spec.delta0) / Math.sqrt(a + c)
      const dfw = (a + c) ** 2 / ((a * a) / (spec.n1 - 1) + (c * c) / (spec.n2 - 1))
      values[b] = tp
      values2[b] = tw
      if ((rule.upper !== undefined && tp >= rule.upper) || (rule.lower !== undefined && tp <= rule.lower)) rejects++
      if (tPValue(tw, dfw, spec.dir) <= spec.alpha) rej2++
      if (onProgress && (b + 1) % chunk === 0) onProgress(b + 1)
    }
    return { counts: null, values, values2, rejects, rejects2: rej2, B: spec.B, meta }
  }

  if (spec.model === 'multinomial') {
    const K = spec.probs.length
    const cdf = new Float64Array(K)
    let acc = 0
    spec.probs.forEach((p, i) => (cdf[i] = acc += p))
    const E = spec.probs.map((p) => p * spec.n)
    const counts = new Float64Array(K)
    const values = new Float64Array(spec.B)
    const values2 = new Float64Array(spec.B)
    for (let b = 0; b < spec.B; b++) {
      counts.fill(0)
      for (let i = 0; i < spec.n; i++) {
        const u = rng.next()
        let k = 0
        while (k < K - 1 && u >= cdf[k]) k++
        counts[k]++
      }
      rng.next() // 확률화용 v (소비 순서 고정)
      const [x2, g] = spec.shape ? indepStat(counts, spec.shape[0], spec.shape[1]) : gofStat(counts, E)
      values[b] = x2
      values2[b] = g
      if (x2 > spec.crit) rejects++
      if (onProgress && (b + 1) % chunk === 0) onProgress(b + 1)
    }
    return { counts: null, values, values2, rejects, B: spec.B, meta }
  }

  const size = spec.model === 'coin' ? spec.n + 1 : spec.model === 'table' ? spec.probs.length : 5
  const counts = new Array<number>(size).fill(0)
  // 이산 확률표: 역누적분포
  const cdf: number[] = []
  if (spec.model === 'table') {
    let acc = 0
    for (const p of spec.probs) cdf.push((acc += p))
  }
  for (let b = 0; b < spec.B; b++) {
    let x: number
    if (spec.model === 'coin') {
      x = 0
      for (let i = 0; i < spec.n; i++) if (rng.next() < spec.theta) x++
    } else if (spec.model === 'table') {
      const u = rng.next()
      x = cdf.findIndex((c) => u < c)
      if (x < 0) x = cdf.length - 1
    } else {
      x = teaGuess(rng).correct
    }
    const v = rng.next()
    counts[x]++
    if (v < spec.phi[x]) rejects++
    if (onProgress && (b + 1) % chunk === 0) onProgress(b + 1)
  }
  return { counts, values: null, rejects, B: spec.B, meta }
}
