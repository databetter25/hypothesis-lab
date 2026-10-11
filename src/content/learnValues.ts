// 안내 학습 본문에 쓰는 수치. 하드코딩하지 않고 엔진에서 계산한다 (PRD A20).
// 엔진은 tests/golden/golden.json(SciPy)과 1e-10 이내로 검증된다.
import { coinAutoRule, coinLrtPValue, coinLrtRule, coinPmf, coinPValue, coinWilksSize, coinLogRatio } from '../engine/coin'
import { expectPhi, npRandomized } from '../engine/discrete'
import { normalAutoRule, normalPower, normalSampleSize } from '../engine/normal'
import { parseTable, tableBestNonRandomized, tableNP, tableSetSize } from '../engine/table'
import { teaPValue } from '../engine/tea'
import { fmtP } from '../lib/format'

const e02 = coinAutoRule(20, 0.5, 0.05, 'R')
const r18 = coinAutoRule(18, 0.5, 0.05, 'R')
const npE05 = npRandomized(coinPmf(20, 0.5), coinPmf(20, 0.7), 0.05, coinLogRatio(20, 0.5, 0.7))
const t06 = parseTable(['.4', '.3', '.2', '.1'], ['.2', '.2', '.3', '.3'])
const t05 = parseTable(['.10', '.20', '.25', '.10', '.35'], ['.25', '.15', '.20', '.10', '.30'])
if (!t06.ok || !t05.ok) throw new Error('교재 확률표 파싱 실패')
const t06best = tableBestNonRandomized(t06.table, '0.1')
const t06r23 = tableSetSize(t06.table, [2, 3])
const t05np = tableNP(t05.table, '0.15')

const raw = {
  teaP4: teaPValue(4).toNumber(),
  teaP4Frac: teaPValue(4).toString(),
  teaP3: teaPValue(3).toNumber(),
  e01p: coinPValue(20, 0.5, 14, 'R'),
  e01two: coinPValue(20, 0.5, 14, 'two-tail'),
  e02c: e02.c,
  e02size: e02.size,
  e02wider: e02.nextSize ?? NaN,
  e03power: expectPhi(e02.phi, coinPmf(20, 0.7)),
  e03beta: 1 - expectPhi(e02.phi, coinPmf(20, 0.7)),
  q4beta055: 1 - expectPhi(e02.phi, coinPmf(20, 0.55)),
  q4beta09: 1 - expectPhi(e02.phi, coinPmf(20, 0.9)),
  t02alpha: normalPower({ upper: 2 }, 0, 1, 1),
  t02beta: 1 - normalPower({ upper: 2 }, 3, 1, 1),
  t02power: normalPower({ upper: 2 }, 3, 1, 1),
  t02alpha3: normalPower({ upper: 3 }, 0, 1, 1),
  t02beta3: 1 - normalPower({ upper: 3 }, 3, 1, 1),
  t11n1: normalPower(normalAutoRule(0, 1, 1, 0.05, 'R'), 1, 1, 1),
  t11n10: normalPower(normalAutoRule(0, 1, 10, 0.05, 'R'), 1, 1, 10),
  e07size18: r18.size,
  e07power18: expectPhi(r18.phi, coinPmf(18, 0.6)),
  e07power20: expectPhi(e02.phi, coinPmf(20, 0.6)),
  e07c18: r18.c,
  nPlan: normalSampleSize(0.5, 1, 0.05, 0.8, 'R'),
  e05gamma: npE05.gamma,
  e05power: expectPhi(npE05.phi, coinPmf(20, 0.7)),
  e05leftPower: coinPmf(20, 0.7).slice(0, 6).reduce((a, b) => a + b, 0),
  e05boundary: npE05.boundary[0],
  e06p14: coinLrtPValue(20, 0.5, 14),
  e06size: coinLrtRule(20, 0.5, 0.05).size,
  e08lrt: coinLrtPValue(20, 0.2, 8),
  e08two: coinPValue(20, 0.2, 8, 'two-tail'),
  w01: coinWilksSize(10, 0.5, 0.05),
  w02: coinWilksSize(20, 0.5, 0.05),
  w04: coinWilksSize(20, 0.1, 0.05),
  w05: coinWilksSize(200, 0.1, 0.05),
}

export const V = raw

/** 표시용 문자열 */
export const S = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, typeof v === 'number' ? fmtP(v) : String(v)])) as Record<keyof typeof raw, string>

export const T = {
  t06bestReject: `{${t06best.reject.join(', ')}}`,
  t06bestPower: t06best.power.toString(),
  t06r23alpha: t06r23.size.toString(),
  t05phi: t05np.phi.map((p, i) => `φ(${i}) = ${p.toString()}`).join(', '),
  t05size: t05np.size.toString(),
  t05power: t05np.power.toString(),
  t05gamma: t05np.gamma?.toString() ?? '—',
  nPlanCeil: String(Math.ceil(raw.nPlan)),
}
