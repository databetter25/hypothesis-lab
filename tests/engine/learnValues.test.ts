import { describe, expect, it } from 'vitest'
import golden from '../golden/golden.json'
import { T, V } from '../../src/content/learnValues'

const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1e-10)

describe('안내 학습 본문 수치 (A20)', () => {
  it('golden과 일치', () => {
    close(V.e01p, golden.E01.pRight)
    expect(V.e02c).toBe(golden.E02.c)
    close(V.e02size, golden.E02.size)
    close(V.e03power, golden.E03.power07)
    close(V.t02alpha, golden.T02.c2.alpha)
    close(V.t02beta, golden.T02.c2.beta)
    close(V.t11n1, golden.T11.n1)
    close(V.t11n10, golden.T11.n10)
    close(V.e05gamma, golden.E05.gamma)
    close(V.e05power, golden.E05.randPower07)
    close(V.e06p14, golden.E06.pLrt14)
    close(V.e08lrt, golden.E08.pLrt)
    close(V.e08two, golden.E08.pTwoTail)
    close(V.w01, golden.W[0].size)
    close(V.w04, golden.W[3].size)
    close(V.teaP4, golden.T01.p4)
    expect(T.t05phi).toBe('φ(0) = 1, φ(1) = 0, φ(2) = 0, φ(3) = 1/2, φ(4) = 0')
    expect(T.t05power).toBe('3/10')
    expect(T.t06bestReject).toBe('{3}')
    expect(T.nPlanCeil).toBe('25')
  })
})
