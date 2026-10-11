/** 95% Wilson 구간 (k: 성공 수, B: 반복 수) */
export function wilson(k: number, B: number, z = 1.959963984540054): [number, number] {
  if (B <= 0) return [0, 1]
  const p = k / B
  const z2 = z * z
  const den = 1 + z2 / B
  const center = (p + z2 / (2 * B)) / den
  const half = (z * Math.sqrt((p * (1 - p)) / B + z2 / (4 * B * B))) / den
  return [Math.max(0, center - half), Math.min(1, center + half)]
}

/** 비율 추정의 표준오차 */
export function propSe(k: number, B: number): number {
  const p = k / B
  return Math.sqrt((p * (1 - p)) / B)
}

/** 0·log 0 = 0 규약 */
export function xlogy(x: number, y: number): number {
  return x === 0 ? 0 : x * Math.log(y)
}
