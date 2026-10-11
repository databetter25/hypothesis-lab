// M3 이산 확률표: 단순가설 f₀ 대 f₁, K ≤ 8. 유리수 정확 산술. PRD v3 §11.4.
import { Frac } from './core/rational'

export interface DiscreteTable {
  f0: Frac[]
  f1: Frac[]
}

export const TABLE_MAX_K = 8

export type ParseResult = { ok: true; table: DiscreteTable } | { ok: false; error: string }

export function parseTable(f0s: string[], f1s: string[]): ParseResult {
  if (f0s.length !== f1s.length) return { ok: false, error: 'f₀와 f₁의 값 개수가 같아야 합니다.' }
  if (f0s.length < 2 || f0s.length > TABLE_MAX_K) return { ok: false, error: `값은 2~${TABLE_MAX_K}개여야 합니다.` }
  const parse = (arr: string[], name: string): Frac[] | string => {
    const out: Frac[] = []
    for (const [i, s] of arr.entries()) {
      const f = Frac.tryParse(s)
      if (!f) return `${name}(${i})를 숫자나 분수로 읽을 수 없습니다: "${s}"`
      if (f.cmp(Frac.ZERO) < 0) return `${name}(${i})는 0 이상이어야 합니다.`
      out.push(f)
    }
    const sum = Frac.sum(out)
    if (!sum.equals(Frac.ONE)) return `${name}의 합이 1이어야 합니다 (현재 ${sum.toString()} ≈ ${sum.toNumber().toFixed(6)}).`
    return out
  }
  const f0 = parse(f0s, 'f₀')
  if (typeof f0 === 'string') return { ok: false, error: f0 }
  const f1 = parse(f1s, 'f₁')
  if (typeof f1 === 'string') return { ok: false, error: f1 }
  return { ok: true, table: { f0, f1 } }
}

/** 가능도비 f₁/f₀ 비교: a가 크면 양수. f₀=0 < f₁이면 ∞ */
function cmpRatio(t: DiscreteTable, a: number, b: number): number {
  const [n1, d1] = [t.f1[a], t.f0[a]]
  const [n2, d2] = [t.f1[b], t.f0[b]]
  const inf1 = d1.isZero()
  const inf2 = d2.isZero()
  if (inf1 && inf2) return 0
  if (inf1) return 1
  if (inf2) return -1
  return n1.mul(d2).cmp(n2.mul(d1))
}

export function ratioLabel(t: DiscreteTable, i: number): string {
  if (t.f0[i].isZero()) return t.f1[i].isZero() ? '—' : '∞'
  return t.f1[i].div(t.f0[i]).toNumber().toFixed(4)
}

export interface TableNPResult {
  /** 가능도비 내림차순(동률은 인덱스 오름차순) */
  order: number[]
  /** 동률 그룹 */
  groups: number[][]
  phi: Frac[]
  gamma: Frac | null
  boundary: number[]
  size: Frac
  power: Frac
}

export function tableNP(t: DiscreteTable, alphaStr: string | Frac): TableNPResult {
  const alpha = typeof alphaStr === 'string' ? Frac.parse(alphaStr) : alphaStr
  const K = t.f0.length
  const usable = Array.from({ length: K }, (_, i) => i).filter((i) => !(t.f0[i].isZero() && t.f1[i].isZero()))
  const order = usable.sort((a, b) => -cmpRatio(t, a, b) || a - b)
  const groups: number[][] = []
  for (const i of order) {
    const g = groups[groups.length - 1]
    if (g && cmpRatio(t, g[0], i) === 0) g.push(i)
    else groups.push([i])
  }
  const phi: Frac[] = Array.from({ length: K }, () => Frac.ZERO)
  let cum = Frac.ZERO
  let gamma: Frac | null = null
  let boundary: number[] = []
  for (const g of groups) {
    const m = Frac.sum(g.map((i) => t.f0[i]))
    if (cum.add(m).cmp(alpha) <= 0) {
      for (const i of g) phi[i] = Frac.ONE
      cum = cum.add(m)
      continue
    }
    gamma = alpha.sub(cum).div(m)
    for (const i of g) phi[i] = gamma
    boundary = [...g]
    cum = alpha
    break
  }
  const power = Frac.sum(phi.map((p, i) => p.mul(t.f1[i])))
  return { order, groups, phi, gamma, boundary, size: cum, power }
}

export function tableSetSize(t: DiscreteTable, reject: number[]): { size: Frac; power: Frac } {
  return {
    size: Frac.sum(reject.map((i) => t.f0[i])),
    power: Frac.sum(reject.map((i) => t.f1[i])),
  }
}

export function tablePhiSize(t: DiscreteTable, phi: Frac[]): { size: Frac; power: Frac } {
  return {
    size: Frac.sum(phi.map((p, i) => p.mul(t.f0[i]))),
    power: Frac.sum(phi.map((p, i) => p.mul(t.f1[i]))),
  }
}

/** 크기 ≤ α인 비확률화 기각역 중 검정력 최대 (전수 탐색). 동률이면 크기 작은 쪽, 원소 적은 쪽 */
export function tableBestNonRandomized(t: DiscreteTable, alphaStr: string | Frac) {
  const alpha = typeof alphaStr === 'string' ? Frac.parse(alphaStr) : alphaStr
  const K = t.f0.length
  let best = { reject: [] as number[], size: Frac.ZERO, power: Frac.ZERO }
  for (let mask = 1; mask < 1 << K; mask++) {
    const reject: number[] = []
    for (let i = 0; i < K; i++) if (mask & (1 << i)) reject.push(i)
    const { size, power } = tableSetSize(t, reject)
    if (size.cmp(alpha) > 0) continue
    const c = power.cmp(best.power)
    if (c > 0 || (c === 0 && (size.cmp(best.size) < 0 || (size.equals(best.size) && reject.length < best.reject.length)))) {
      best = { reject, size, power }
    }
  }
  return best
}
