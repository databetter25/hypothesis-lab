// 이산 통계량에 대한 공통 계산: 검정함수 기댓값, 확률화 NP, p-값의 분포.

/** 동률 판정 허용오차 (로그 척도), PRD §11.5 */
export function nearlyEqual(a: number, b: number): boolean {
  if (a === b) return true
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
}

/** E[φ(X)] = Σ φ(x) f(x) */
export function expectPhi(phi: ArrayLike<number>, f: ArrayLike<number>): number {
  let s = 0
  for (let i = 0; i < f.length; i++) if (phi[i] !== 0) s += phi[i] * f[i]
  return s
}

/** 검정력 π(θ) = E_θ[φ(X)] — 이름만 다른 별칭 */
export const powerAt = expectPhi

export interface NPResult {
  phi: Float64Array
  /** 경계 그룹의 확률화 확률 (경계가 없으면 0) */
  gamma: number
  /** 경계 그룹에 속한 값의 인덱스 */
  boundary: number[]
  /** 가능도비 내림차순 인덱스 */
  order: number[]
  size: number
}

/**
 * 네이만–피어슨 확률화 최강력 규칙 (PRD §11.4).
 * logRatio를 주면 그것으로 순서를 정한다(언더플로 방지). 없으면 log f1 − log f0.
 */
export function npRandomized(
  f0: ArrayLike<number>,
  f1: ArrayLike<number>,
  alpha: number,
  logRatio?: ArrayLike<number>,
): NPResult {
  const K = f0.length
  const lr = new Float64Array(K)
  const usable: number[] = []
  for (let i = 0; i < K; i++) {
    if (logRatio) lr[i] = logRatio[i]
    else if (f0[i] === 0) lr[i] = f1[i] > 0 ? Infinity : NaN
    else lr[i] = Math.log(f1[i]) - Math.log(f0[i])
    if (!Number.isNaN(lr[i])) usable.push(i)
  }
  const order = usable.sort((a, b) => lr[b] - lr[a] || a - b)

  // 동률 그룹
  const groups: number[][] = []
  for (const i of order) {
    const g = groups[groups.length - 1]
    if (g && nearlyEqual(lr[g[0]], lr[i])) g.push(i)
    else groups.push([i])
  }

  const phi = new Float64Array(K)
  let cum = 0
  let gamma = 0
  let boundary: number[] = []
  for (const g of groups) {
    let m = 0
    for (const i of g) m += f0[i]
    if (cum + m <= alpha * (1 + 1e-14)) {
      for (const i of g) phi[i] = 1
      cum += m
      continue
    }
    gamma = m > 0 ? (alpha - cum) / m : 0
    for (const i of g) phi[i] = gamma
    boundary = [...g].sort((a, b) => a - b)
    cum += gamma * m
    break
  }
  return { phi, gamma, boundary, order, size: cum }
}

export interface PDistEntry {
  value: number
  prob: number
}

/** x별 p-값과 θ* 아래 확률로 p-값의 (유한) 분포를 만든다. value 오름차순. */
export function pValueDistribution(pvals: ArrayLike<number>, f: ArrayLike<number>): PDistEntry[] {
  const idx = Array.from({ length: pvals.length }, (_, i) => i).sort((a, b) => pvals[a] - pvals[b])
  const out: PDistEntry[] = []
  for (const i of idx) {
    const last = out[out.length - 1]
    if (last && nearlyEqual(last.value, pvals[i])) last.prob += f[i]
    else out.push({ value: pvals[i], prob: f[i] })
  }
  return out
}

/** 비확률화 기각 집합을 구간 문자열로: [0,1,2,5] → "0-2,5" */
export function encodeRanges(xs: number[]): string {
  const s = [...xs].sort((a, b) => a - b)
  const parts: string[] = []
  let i = 0
  while (i < s.length) {
    let j = i
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++
    parts.push(i === j ? `${s[i]}` : `${s[i]}-${s[j]}`)
    i = j + 1
  }
  return parts.join(',')
}

export function decodeRanges(str: string, max: number): number[] | null {
  if (str.trim() === '') return []
  const out = new Set<number>()
  for (const part of str.split(',')) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part.trim())
    if (!m) return null
    const a = Number(m[1])
    const b = m[2] === undefined ? a : Number(m[2])
    if (b < a) return null
    for (let x = a; x <= Math.min(b, max); x++) out.add(x)
  }
  return [...out].sort((a, b) => a - b)
}
