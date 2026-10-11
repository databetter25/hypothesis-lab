// PRD v3 §13 프리셋. 수치 기준값은 tests/golden/golden.json (SciPy)에서 검증한다.
import type { ModuleId } from '../state/labState'

export interface Preset {
  id: string
  title: string
  source: string
  module: ModuleId
  query: Record<string, string | number>
  expect: string
  group: 'T' | 'E' | 'W' | 'X' | 'C' | 'Y' | 'P'
}

export const PRESETS: Preset[] = [
  { id: 'T01', group: 'T', title: '홍차 감별: 네 잔 모두 정답', source: '교재 7.1 · p.257', module: 'pvalue', query: { model: 'tea', x: 4, a: 0.05 }, expect: 'P(K=4) = 1/70 ≈ 0.0143' },
  { id: 'T02', group: 'T', title: '예 7.1: 기각역 x ≥ 2의 두 오류', source: '교재 예 7.1 · p.260', module: 'errors', query: { model: 'normal', n: 1, t0: 0, t1: 3, sd: 1, dir: 'R', rule: 'manual', c: 2 }, expect: 'α = 0.0228, β = 0.1587, 검정력 0.8413' },
  { id: 'T03', group: 'T', title: '예 7.3: 포아송 평균의 최강력검정', source: '교재 예 7.3 · p.267', module: 'more', query: { model: 'pois', n: 10, t0: 0.3, t1: 0.1, ts: 0.1, x: 1, a: 0.19915 }, expect: 'R = {ΣXᵢ ≤ 1}, 크기 4e⁻³ = 0.1991, 검정력 2e⁻¹ = 0.7358' },
  { id: 'T04', group: 'T', title: '예 7.4: 정규 평균의 최강력검정', source: '교재 예 7.4 · p.268', module: 'np', query: { model: 'normal', n: 10, t0: 0, t1: 0.5, sd: 1, a: 0.05 }, expect: 'R = {Z ≥ 1.645}, θ₁에 무관' },
  { id: 'T05b', group: 'T', title: '예 7.5: 정규 분산의 최강력검정', source: '교재 예 7.5 · p.269', module: 'more', query: { model: 'nvar', n: 5, t0: 1, t1: 2, ts: 1, x: 9, a: 0.05 }, expect: 'W ≥ χ²₀.₀₅(5) = 11.07, σ₁ = 2에서 검정력 0.7358' },
  { id: 'T05', group: 'T', title: '표 7.3: α = 0.15 최강력 검정함수', source: '교재 7.6 · p.284', module: 'np', query: { model: 'table', f0: '.10,.20,.25,.10,.35', f1: '.25,.15,.20,.10,.30', a: 0.15 }, expect: 'φ(0)=1, φ(3)=1/2, 검정력 3/10' },
  { id: 'T06', group: 'T', title: '워크북 연습 3~5: 이산 확률표', source: '워크북 p.129', module: 'np', query: { model: 'table', f0: '.4,.3,.2,.1', f1: '.2,.2,.3,.3', a: 0.1, R: '2-3' }, expect: 'R={2,3}: α=0.3, β=0.4 / α=0.1 최강력 R={3}' },
  { id: 'T07', group: 'T', title: '2018 기말 22~23', source: '워크북 p.169', module: 'errors', query: { model: 'table', f0: '9/27,12/27,5/27,1/27', f1: '2/27,6/27,12/27,7/27', R: '2-3' }, expect: 'α = 6/27, β = 8/27' },
  { id: 'T08', group: 'T', title: '연습문제 3~5: B(5, θ), 1/2 대 2/3', source: '교재 p.292~294', module: 'errors', query: { model: 'coin', n: 5, t0: 0.5, t1: 0.6667, dir: 'R', rule: 'manual', c: 4 }, expect: 'α = 3/16, β = 131/243 ≈ 0.5391' },
  { id: 'T09', group: 'T', title: '프로그램 7.1: H₀ 아래 z검정 1만 번', source: '교재 p.287', module: 'lrt', query: { model: 'normal', n: 10, t0: 0, sd: 1, a: 0.05, x: 0.3, B: 10000 }, expect: '정확값 0.05 (교재 실행 0.0483)' },
  { id: 'T10', group: 'T', title: '프로그램 7.2: t통계량에 z 임계값을 쓰면', source: '교재 p.288', module: 'ttest', query: { model: 't1', n: 10, x: 0.3, sd: 1, t0: 0, ts: 0, sig: 1, a: 0.05, dir: 'two', B: 10000 }, expect: 't 임계값 0.05, z 임계값 0.0816 (교재 실행 0.0823)' },
  { id: 'T11', group: 'T', title: '프로그램 7.3: n = 1과 10의 검정력', source: '교재 p.289', module: 'power', query: { model: 'normal', n: 10, t0: 0, ts: 1, sd: 1, a: 0.05, dir: 'R' }, expect: 'n=1: 0.2595, n=10: 0.9354' },
  { id: 'T12', group: 'T', title: '예 7.6·연습문제 07: 정규 양측 LRT', source: '교재 p.273, 294', module: 'lrt', query: { model: 'normal', n: 10, t0: 1, sd: 1, a: 0.05, x: 1.5 }, expect: '−2 log Λ = n(X̄−1)² ~ χ²₁ (정확)' },
  { id: 'E01', group: 'E', title: '20번 중 앞면 14회의 p-값', source: '위키백과 p-value 예와 동일', module: 'pvalue', query: { model: 'coin', n: 20, t0: 0.5, x: 14, a: 0.05, dir: 'R' }, expect: 'p = 0.0577 → 비기각' },
  { id: 'E02', group: 'E', title: '자동 임계값과 실제 크기', source: 'PRD E02', module: 'pvalue', query: { model: 'coin', n: 20, t0: 0.5, x: 14, a: 0.05, dir: 'R' }, expect: 'c = 15, 크기 0.0207' },
  { id: 'E03', group: 'E', title: 'θ* = 0.7에서 검정력', source: 'PRD E03', module: 'power', query: { model: 'coin', n: 20, t0: 0.5, ts: 0.7, a: 0.05, dir: 'R' }, expect: 'π = 0.4164, β = 0.5836' },
  { id: 'E05', group: 'E', title: '확률화 최강력검정과 비교 기각역', source: 'PRD E05', module: 'np', query: { model: 'coin', n: 20, t0: 0.5, t1: 0.7, a: 0.05 }, expect: 'X=14에서 γ = 0.7928, π = 0.5683' },
  { id: 'E06', group: 'E', title: '양측 가능도비검정', source: 'PRD E06', module: 'lrt', query: { model: 'coin', n: 20, t0: 0.5, a: 0.05, x: 14 }, expect: 'R = {0..5, 15..20}, p = 0.1153' },
  { id: 'E07', group: 'E', title: 'n이 늘었는데 검정력이 줄어든다', source: 'PRD E07', module: 'power', query: { model: 'coin', n: 18, t0: 0.5, ts: 0.6, a: 0.05, dir: 'R' }, expect: 'n=18: 0.2088 > n=20: 0.1256' },
  { id: 'E08', group: 'E', title: '두 양측 p-값의 판정이 갈린다', source: 'PRD E08', module: 'lrt', query: { model: 'coin', n: 20, t0: 0.2, a: 0.05, x: 8 }, expect: 'Λ 순서 0.0437 (기각) vs 꼬리×2 0.0643' },
  { id: 'E09', group: 'E', title: 'H₀ 아래 p-값의 분포', source: 'PRD E09', module: 'pdist', query: { model: 'coin', n: 20, t0: 0.5, ts: 0.5, a: 0.05, dir: 'R' }, expect: 'P(p ≤ 0.05) = 0.0207' },
  { id: 'E10', group: 'E', title: 'UMP: θ₁을 바꿔도 같은 기각역', source: 'PRD E10', module: 'np', query: { model: 'coin', n: 20, t0: 0.5, t1: 0.9, a: 0.05 }, expect: 'θ₁ > 0.5이면 φ 동일' },
  { id: 'E11', group: 'E', title: 'Arbuthnot(1710)의 출생 성비', source: '위키백과·KCI 논문', module: 'pvalue', query: { model: 'coin', n: 82, t0: 0.5, x: 82, a: 0.05, dir: 'R' }, expect: 'p = 2⁻⁸² ≈ 2.07×10⁻²⁵' },
  { id: 'W01', group: 'W', title: 'Wilks 근사가 빗나가는 경우', source: 'PRD W01', module: 'lrt', query: { model: 'coin', n: 10, t0: 0.5, a: 0.05, x: 5 }, expect: 'χ² 기각역의 크기 0.1094' },
  { id: 'W04', group: 'W', title: 'θ₀가 경계에 가까울 때', source: 'PRD W04', module: 'lrt', query: { model: 'coin', n: 20, t0: 0.1, a: 0.05, x: 2 }, expect: 'χ² 기각역의 크기 0.1328' },
  { id: 'X01', group: 'X', title: 'Mendel 완두 9:3:3:1 적합도', source: '교재 7.4 · Mendel(1866)', module: 'chisq', query: { model: 'gof', p0: '9/16,3/16,3/16,1/16', obs: '315,101,108,32', a: 0.05 }, expect: 'X² = 0.470, 자유도 3, p = 0.925' },
  { id: 'X02', group: 'X', title: '범주 2개이면 X² = z²', source: '교재 7.4 · 동전 E01', module: 'chisq', query: { model: 'gof', p0: '1/2,1/2', obs: '14,6', a: 0.05 }, expect: 'X² = 3.2 = z², p = 0.0736' },
  { id: 'X03', group: 'X', title: '기대도수가 작을 때의 근사', source: '교재 정리 7.2', module: 'chisq', query: { model: 'gof', p0: '1/5,1/5,1/5,1/5,1/5', obs: '1,5,3,2,4', a: 0.05, B: 10000 }, expect: '모든 E = 3, X² = 3.33' },
  { id: 'X04', group: 'X', title: '분할표 독립성 (교재 예 7.9)', source: '교재 예 7.9 · p.282', module: 'chisq', query: { model: 'indep', obs: '20,30,25/30,20,25', a: 0.05 }, expect: 'X² = 4, 자유도 2, p = e⁻² ≈ 0.1353' },
  { id: 'C01', group: 'C', title: '동전 14/20의 95% 신뢰구간과 θ₀ = 0.5 검정', source: '교재 8.7 · E01', module: 'ci', query: { model: 'coin', n: 20, x: 14, a: 0.05, t0: 0.5, ts: 0.5 }, expect: 'Clopper–Pearson [0.457, 0.881] ∋ 0.5 ⇔ p = 0.1153 > 0.05' },
  { id: 'C02', group: 'C', title: '교재 예 8.8: 모비율의 신뢰구간', source: '교재 예 8.8 · p.320', module: 'ci', query: { model: 'coin', n: 400, x: 280, a: 0.05, t0: 0.65, ts: 0.7 }, expect: 'Wald [0.655, 0.745]' },
  { id: 'C03', group: 'C', title: 'Wald 구간의 포함확률이 모자라는 경우', source: '교재 정리 8.8', module: 'ci', query: { model: 'coin', n: 20, x: 2, a: 0.05, t0: 0.1, ts: 0.1, B: 10000 }, expect: 'θ* = 0.1: Wald 0.876, Wilson 0.957, CP 0.989' },
  { id: 'C04', group: 'C', title: '정규 평균: 구간 ⇔ 양측 z검정', source: '교재 식 8.54~8.58', module: 'ci', query: { model: 'normal', n: 10, sd: 1, x: 0.6, a: 0.05, t0: 0, ts: 0, dir: 'two' }, expect: '[−0.020, 1.220] ∋ 0 ⇔ p = 0.0578' },
  { id: 'Y01', group: 'Y', title: '한 표본 t와 μ의 신뢰구간', source: '교재 예 7.7', module: 'ttest', query: { model: 't1', n: 10, x: 0.6, sd: 1.2, t0: 0, a: 0.05, dir: 'two' }, expect: 't = 1.581, p = 0.1483, 구간 [−0.258, 1.458]' },
  { id: 'Y02', group: 'Y', title: '두 표본 t: 합동분산과 Welch', source: '교재 예 7.8 (가상 요약값)', module: 'ttest', query: { model: 't2', n: 12, x: 5.2, sd: 1.5, n2: 15, y: 4.1, sd2: 2, t0: 0, a: 0.05, dir: 'two' }, expect: '합동 t = 1.580 (p = 0.1266), Welch t = 1.632 (p = 0.1152)' },
  { id: 'Y03', group: 'Y', title: '등분산 가정이 깨지면 합동 t의 크기가 부푼다', source: '교재 예 7.8 · 시뮬레이션', module: 'ttest', query: { model: 't2', n: 10, x: 0, sd: 3, n2: 40, y: 0, sd2: 1, t0: 0, ts: 0, sig: 3, sig2: 1, a: 0.05, dir: 'two', B: 10000 }, expect: '합동 t 크기 > 0.1, Welch ≈ 0.05' },
  { id: 'P01', group: 'P', title: '10번 엿보고 유의하면 멈추기', source: '오용 체험 · 선택적 중단', module: 'pitfalls', query: { model: 'seq', n: 100, nmin: 10, step: 10, t0: 0.5, ts: 0.5, a: 0.05, B: 10000 }, expect: '한 번만 보면 0.0352 → 10번 엿보면 0.1432' },
  { id: 'P02', group: 'P', title: '한 번 던질 때마다 엿보기', source: '오용 체험 · 선택적 중단', module: 'pitfalls', query: { model: 'seq', n: 100, nmin: 1, step: 1, t0: 0.5, ts: 0.5, a: 0.05, B: 10000 }, expect: '실제 크기 0.2273' },
  { id: 'P03', group: 'P', title: '귀무가설이 모두 참인 검정 20개', source: '오용 체험 · 다중검정', module: 'pitfalls', query: { model: 'multi', m: 20, m0: 20, eff: 2.5, a: 0.05, B: 10000 }, expect: 'FWER 0.6415 → Bonferroni 0.0488' },
  { id: 'P04', group: 'P', title: 'FWER 대 FDR: Bonferroni·Holm·BH', source: '오용 체험 · 다중검정', module: 'pitfalls', query: { model: 'multi', m: 20, m0: 15, eff: 2.5, a: 0.05, B: 10000 }, expect: 'BH의 FDR = (15/20)·0.05 = 0.0375' },
]

export function presetHref(p: Preset): string {
  const q = new URLSearchParams(Object.entries(p.query).map(([k, v]) => [k, String(v)]))
  return `/lab/${p.module}?${q.toString()}`
}
