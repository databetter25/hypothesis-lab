// 오용 체험 (PRD F18): 선택적 중단(엿보기)과 다중검정.
import { coinPmf } from './coin'
import { normPpf, normSf } from './core/normal'

/* ---------------- 선택적 중단 ---------------- */

/** n번째에서 양측(꼬리×2) 정확 검정의 기각역: x ≤ lo 또는 x ≥ hi (lo = −1, hi = n+1이면 해당 꼬리 없음) */
export function twoTailBounds(n: number, theta0: number, alpha: number): [number, number] {
  const f = coinPmf(n, theta0)
  const low = new Float64Array(n + 1)
  const up = new Float64Array(n + 1)
  let acc = 0
  for (let x = 0; x <= n; x++) low[x] = acc += f[x]
  acc = 0
  for (let x = n; x >= 0; x--) up[x] = acc += f[x]
  let lo = -1
  let hi = n + 1
  for (let x = 0; x <= n; x++) {
    const p = Math.min(1, 2 * Math.min(low[x], up[x]))
    if (p <= alpha) {
      if (x <= n * theta0) lo = x
      else if (hi === n + 1) hi = x
    }
  }
  return [lo, hi]
}

export function seqLooks(nMin: number, nMax: number, step: number): number[] {
  const out: number[] = []
  for (let n = nMin; n <= nMax; n += step) out.push(n)
  if (out[out.length - 1] !== nMax) out.push(nMax)
  return out
}

export interface SeqExact {
  /** 어느 시점에서든 기각할 확률 (θ = θ₀이면 실제 크기, 아니면 검정력) */
  reject: number
  /** 각 엿보기 시점에서 처음 기각할 확률 */
  stopAt: number[]
  /** k번째 엿보기까지 누적 기각 확률 */
  cumulative: number[]
  /** 기대 표본크기 E[N] (기각하면 그 자리에서 멈춘다) */
  expectedN: number
  bounds: [number, number][]
}

/**
 * 이항 확률보행의 동적계획: 멈추지 않은 경로의 x 분포를 한 번에 한 개씩 갱신하고,
 * 엿보기 시점마다 기각역에 든 확률을 떼어 낸다. 결과는 근사가 아니라 정확한 값이다.
 */
export function seqExact(theta: number, theta0: number, looks: number[], alpha: number): SeqExact {
  const nMax = looks[looks.length - 1]
  const lookSet = new Map(looks.map((n, i) => [n, i]))
  const bounds = looks.map((n) => twoTailBounds(n, theta0, alpha))
  let alive = new Float64Array(nMax + 1)
  alive[0] = 1
  const stopAt = new Array<number>(looks.length).fill(0)
  for (let n = 1; n <= nMax; n++) {
    const next = new Float64Array(nMax + 1)
    for (let x = 0; x < n; x++) {
      const a = alive[x]
      if (a === 0) continue
      next[x] += a * (1 - theta)
      next[x + 1] += a * theta
    }
    alive = next
    const k = lookSet.get(n)
    if (k !== undefined) {
      const [lo, hi] = bounds[k]
      let s = 0
      for (let x = 0; x <= lo; x++) {
        s += alive[x]
        alive[x] = 0
      }
      for (let x = Math.max(hi, 0); x <= n; x++) {
        s += alive[x]
        alive[x] = 0
      }
      stopAt[k] = s
    }
  }
  const cumulative: number[] = []
  let c = 0
  for (const s of stopAt) cumulative.push((c += s))
  const expectedN = looks.reduce((e, n, i) => e + n * stopAt[i], 0) + nMax * (1 - c)
  return { reject: c, stopAt, cumulative, expectedN, bounds }
}

/* ---------------- 다중검정 ---------------- */

export type MultiMethod = 'none' | 'bonf' | 'holm' | 'bh'

export const MULTI_METHODS: { id: MultiMethod; label: string; controls: string; color: string }[] = [
  { id: 'none', label: '보정 없음', controls: '개별 검정의 α', color: 'var(--c-reject)' },
  { id: 'bonf', label: 'Bonferroni', controls: 'FWER ≤ α', color: 'var(--c-blue)' },
  { id: 'holm', label: 'Holm', controls: 'FWER ≤ α (Bonferroni보다 강력)', color: '#1a7f37' },
  { id: 'bh', label: 'Benjamini–Hochberg', controls: 'FDR ≤ α', color: 'var(--c-alt)' },
]

/** 각 방법이 기각하는 검정(원래 순서의 인덱스) */
export function multiReject(p: ArrayLike<number>, alpha: number, method: MultiMethod): boolean[] {
  const m = p.length
  const out = new Array<boolean>(m).fill(false)
  if (method === 'none' || method === 'bonf') {
    const cut = method === 'none' ? alpha : alpha / m
    for (let i = 0; i < m; i++) out[i] = p[i] <= cut
    return out
  }
  const order = Array.from({ length: m }, (_, i) => i).sort((a, b) => p[a] - p[b])
  if (method === 'holm') {
    for (let k = 0; k < m; k++) {
      if (p[order[k]] <= alpha / (m - k)) out[order[k]] = true
      else break
    }
    return out
  }
  let kMax = -1
  for (let k = 0; k < m; k++) if (p[order[k]] <= ((k + 1) * alpha) / m) kMax = k
  for (let k = 0; k <= kMax; k++) out[order[k]] = true
  return out
}

/** 독립 단측 z검정 m개 (참인 귀무 m0개, 나머지는 평균 δ로 이동) 아래의 정확한 값 */
export function multiExact(m: number, m0: number, delta: number, alpha: number) {
  const pow = (cut: number) => normSf(normPpf(1 - cut) - delta)
  return {
    fwerNone: 1 - (1 - alpha) ** m0,
    fwerBonf: 1 - (1 - alpha / m) ** m0,
    /** 독립·연속 p-값에서 BH의 FDR은 정확히 (m0/m)α */
    fdrBH: (m0 / m) * alpha,
    powerNone: m0 < m ? pow(alpha) : NaN,
    powerBonf: m0 < m ? pow(alpha / m) : NaN,
  }
}
