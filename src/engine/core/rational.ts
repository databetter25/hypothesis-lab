// BigInt 기약분수. 이산 확률표 모형의 정확 산술에 사용 (PRD v3 §11.4).

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a
  b = b < 0n ? -b : b
  while (b !== 0n) [a, b] = [b, a % b]
  return a
}

export class Frac {
  readonly n: bigint
  readonly d: bigint

  constructor(n: bigint, d: bigint = 1n) {
    if (d === 0n) throw new Error('분모가 0입니다')
    if (d < 0n) {
      n = -n
      d = -d
    }
    const g = gcd(n, d) || 1n
    this.n = n / g
    this.d = d / g
  }

  static readonly ZERO = new Frac(0n)
  static readonly ONE = new Frac(1n)

  static of(n: number, d = 1): Frac {
    return new Frac(BigInt(n), BigInt(d))
  }

  /** "9/27", "0.25", "1", " 3 / 16 " */
  static tryParse(s: string): Frac | null {
    const t = s.trim()
    let m = /^(-?\d+)\s*\/\s*(\d+)$/.exec(t)
    if (m) {
      const d = BigInt(m[2])
      return d === 0n ? null : new Frac(BigInt(m[1]), d)
    }
    m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(t)
    if (m && (m[2] || m[3])) {
      const frac = m[3] ?? ''
      const num = BigInt((m[2] || '0') + frac)
      const den = 10n ** BigInt(frac.length)
      return new Frac(m[1] === '-' ? -num : num, den)
    }
    return null
  }

  static parse(s: string): Frac {
    const f = Frac.tryParse(s)
    if (!f) throw new Error(`분수로 읽을 수 없음: ${s}`)
    return f
  }

  add(o: Frac): Frac {
    return new Frac(this.n * o.d + o.n * this.d, this.d * o.d)
  }
  sub(o: Frac): Frac {
    return new Frac(this.n * o.d - o.n * this.d, this.d * o.d)
  }
  mul(o: Frac): Frac {
    return new Frac(this.n * o.n, this.d * o.d)
  }
  div(o: Frac): Frac {
    return new Frac(this.n * o.d, this.d * o.n)
  }
  cmp(o: Frac): -1 | 0 | 1 {
    const l = this.n * o.d
    const r = o.n * this.d
    return l < r ? -1 : l > r ? 1 : 0
  }
  equals(o: Frac): boolean {
    return this.cmp(o) === 0
  }
  isZero(): boolean {
    return this.n === 0n
  }
  toNumber(): number {
    return Number(this.n) / Number(this.d)
  }
  toString(): string {
    return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`
  }

  static sum(xs: Frac[]): Frac {
    return xs.reduce((a, b) => a.add(b), Frac.ZERO)
  }
}
