// log k! 표 (k ≤ 1000). 누적합으로 계산한다.
const MAX = 1000
const table = new Float64Array(MAX + 1)
for (let k = 1; k <= MAX; k++) table[k] = table[k - 1] + Math.log(k)

export function logFactorial(k: number): number {
  if (k < 0 || k > MAX || !Number.isInteger(k)) throw new RangeError(`logFactorial: ${k}`)
  return table[k]
}

export function logChoose(n: number, k: number): number {
  return table[n] - table[k] - table[n - k]
}
