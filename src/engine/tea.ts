// M4 홍차 감별 (교재 7.1, Fisher 1935). 8잔(각 4잔), H₀ 아래 정답 수 K ~ 초기하(8, 4, 4).
import { Frac } from './core/rational'
import type { Rng } from './core/rng'

const choose = (n: number, k: number): number => {
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return Math.round(r)
}

/** P(K = k), k = 0…4: (1, 16, 36, 16, 1)/70 */
export function teaPmf(): Frac[] {
  return [0, 1, 2, 3, 4].map((k) => Frac.of(choose(4, k) * choose(4, 4 - k), 70))
}

/** p-값 = P(K ≥ k) */
export function teaPValue(k: number): Frac {
  return Frac.sum(teaPmf().slice(k))
}

/** 무작위 추측 한 번: 8잔(앞 4잔이 "차 먼저") 중 4잔을 고르고 정답 수를 센다 (부분 Fisher–Yates) */
export function teaGuess(rng: Rng): { picks: number[]; correct: number } {
  const cups = [0, 1, 2, 3, 4, 5, 6, 7]
  for (let i = 0; i < 4; i++) {
    const j = i + Math.floor(rng.next() * (8 - i))
    ;[cups[i], cups[j]] = [cups[j], cups[i]]
  }
  const picks = cups.slice(0, 4)
  return { picks, correct: picks.filter((c) => c < 4).length }
}
