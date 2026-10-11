// 역사 콘텐츠 (PRD v3 §15). 출처 대조 상태를 함께 관리한다 (A12: 게시 전 원문 대조).
// 인용문은 직접 옮기지 않고 내용만 요약한다.

export type Era = 'origin' | 'early' | 'classic' | 'settle'

export const ERAS: { id: Era; title: string; span: string }[] = [
  { id: 'origin', title: '출발: 출생 성비', span: '18세기' },
  { id: 'early', title: '20세기 초: 적합도와 소표본', span: '1900~1910년대' },
  { id: 'classic', title: 'Fisher와 Neyman–Pearson', span: '1920~1930년대' },
  { id: 'settle', title: '정착과 반성', span: '1940년대~현재' },
]

export interface TimelineItem {
  year: string
  era: Era
  who: string
  what: string
  source: string
  /** 출처끼리 일치하는지 확인했는가 */
  verified: boolean
  note?: string
  /** 관련 실험 (해시 경로) */
  link?: { to: string; label: string }
}

export const TIMELINE: TimelineItem[] = [
  {
    year: '1710',
    era: 'origin',
    who: 'John Arbuthnot',
    what: '런던 출생 기록 82년(1629~1710)이 모두 남아가 많았다. 남녀 출생이 반반이라면 이런 일이 일어날 확률은 (1/2)⁸²로, 우연으로 보기 어렵다고 결론지었다. 오늘날 부호검정의 원형이다.',
    source: '조재근(2013) 2.2절, 위키백과',
    verified: true,
    link: { to: '/lab/pvalue?model=coin&n=82&t0=0.5&x=82&a=0.05&dir=R', label: '동전 모형으로 재현 (E11)' },
  },
  {
    year: '1770년대',
    era: 'origin',
    who: 'Pierre-Simon Laplace',
    what: '약 50만 건의 출생 자료를 이항 모형으로 분석해 남아 초과가 실재함을 확률적으로 논증했다.',
    source: '조재근(2013), 위키백과',
    verified: false,
    note: '정확한 연도는 원문 확인 필요',
  },
  {
    year: '1900',
    era: 'early',
    who: 'Karl Pearson',
    what: 'χ² 적합도 검정. 관측 빈도와 기대 빈도의 차이로 이론 분포가 자료에 맞는지 판단했다. 일종의 유의성 검정이다.',
    source: '교재 표 1.1, 위키백과',
    verified: true,
    note: '교재 1.7 본문은 1901로 적음',
  },
  {
    year: '1908',
    era: 'early',
    who: 'W. S. Gosset ("Student")',
    what: '표본이 작을 때 표본평균의 분포(t분포)를 구해 소표본 검정의 길을 열었다.',
    source: '교재 1.7·표 1.1',
    verified: true,
  },
  {
    year: '1925',
    era: 'classic',
    who: 'R. A. Fisher',
    what: '『연구자를 위한 통계적 방법』에서 유의성 검정을 체계화했다. p-값을 귀무가설에 대한 반대 증거로 보고, 0.05를 편의상의 기준으로 제시했다.',
    source: '조재근(2013), 위키백과',
    verified: true,
    note: '교재 표 1.1에는 이 항목이 없음',
    link: { to: '/lab/pvalue?model=coin&n=20&t0=0.5&x=14&a=0.05&dir=R', label: 'p-값 실험 (E01)' },
  },
  {
    year: '1928',
    era: 'classic',
    who: 'J. Neyman & E. S. Pearson',
    what: '검정 기준을 고르는 원리로 가능도비 기준을 제안했다.',
    source: '조재근(2013)',
    verified: false,
    note: '원문 서지 확인 필요',
    link: { to: '/lab/lrt?model=coin&n=20&t0=0.5&a=0.05&x=14', label: '가능도비검정 실험' },
  },
  {
    year: '1933',
    era: 'classic',
    who: 'J. Neyman & E. S. Pearson',
    what: '「가장 효율적인 검정에 관하여」: 두 종류의 오류, 유의수준, 검정력을 정의하고 최강력검정을 구하는 보조정리를 증명했다.',
    source: '교재 각주 2·표 1.1',
    verified: true,
    link: { to: '/lab/np?model=table&f0=.10,.20,.25,.10,.35&f1=.25,.15,.20,.10,.30&a=0.15', label: '최강력검정 실험 (교재 표 7.3)' },
  },
  {
    year: '1935',
    era: 'classic',
    who: 'R. A. Fisher',
    what: '『실험계획법』의 홍차 감별 실험. 대립가설 없이, 무작위화와 귀무가설 아래의 정확한 확률(1/70)로 판단했다.',
    source: '위키백과 (교재 각주 1은 1956년 재수록본)',
    verified: true,
    link: { to: '/lab/pvalue?model=tea&x=4', label: '홍차 감별 실험 (T01)' },
  },
  {
    year: '1937',
    era: 'classic',
    who: 'J. Neyman',
    what: '신뢰구간. 검정과 같은 틀에서 모수의 불확실성을 구간으로 나타냈다 (교재 8.7의 쌍대성).',
    source: '교재 표 1.1',
    verified: true,
  },
  {
    year: '1938',
    era: 'classic',
    who: 'S. S. Wilks',
    what: '표본이 클 때 −2 log Λ가 근사적으로 χ²분포를 따름을 보였다 (교재 정리 7.2).',
    source: '위키백과',
    verified: false,
    note: '원문 서지 확인 필요',
    link: { to: '/lab/lrt?model=coin&n=10&t0=0.5&a=0.05&x=5', label: 'Wilks 근사 점검 (W01)' },
  },
  {
    year: '1940년대~',
    era: 'settle',
    who: '응용 분야의 교과서',
    what: 'Fisher의 p-값과 NP의 유의수준·대립가설을 섞은 혼합 절차(NHST)가 특히 심리학에서 표준이 되었다. 두 진영 어느 쪽도 이 혼합을 제안하지 않았다.',
    source: '조재근(2013) 3장, 위키백과',
    verified: true,
    link: { to: '/learn/12', label: '안내 학습 12단계' },
  },
  {
    year: '1962',
    era: 'settle',
    who: 'Fisher 사망',
    what: '1930년대부터 이어진 Fisher와 Neyman의 논쟁은 끝내 타협점을 찾지 못한 채 막을 내렸다.',
    source: '위키백과, 조재근(2013)',
    verified: true,
  },
  {
    year: '2016',
    era: 'settle',
    who: '미국통계학회(ASA)',
    what: 'p-값의 의미와 오용에 관한 공식 성명. 6가지 원칙을 제시했다.',
    source: 'Wasserstein & Lazar (2016), 위키백과',
    verified: false,
    note: '원칙 문구는 원문 대조 필요',
  },
]

export const COMPARISON: [string, string, string][] = [
  ['가설', 'H₀만 설정. 두 종류의 오류를 정의하지 않음', 'H₀와 H₁ 설정'],
  ['사전 결정', '—', 'α(필요하면 β와 표본크기)를 자료 수집 전에 정함'],
  ['산출', '정확한 p-값', '검정통계량이 기각역에 속하는지'],
  ['해석', '귀무가설에 대한 반대 증거의 강도. 잠정적 결론', '반복 적용 시 오류 비율을 통제하는 행동 규칙'],
  ['철학', '귀납적 추론 (inductive inference)', '귀납적 행동 (inductive behavior)'],
  ['상대의 비판', '검정통계량 선택에 최적성 근거가 없음', '품질관리 같은 반복 결정에나 맞고 과학적 추론에는 부적합'],
]

/** ASA(2016) 6원칙 — 원문 대조 전 한국어 요약 */
export const ASA_PRINCIPLES: string[] = [
  'p-값은 자료가 특정 통계 모형과 얼마나 양립하지 않는지를 나타낼 수 있다.',
  'p-값은 연구 가설이 참일 확률도, 자료가 우연만으로 생겼을 확률도 아니다.',
  '과학적 결론이나 정책 결정을 p-값이 특정 기준을 넘었는지만으로 내려서는 안 된다.',
  '올바른 추론에는 완전한 보고와 투명성이 필요하다.',
  'p-값이나 통계적 유의성은 효과의 크기나 결과의 중요성을 측정하지 않는다.',
  'p-값 하나만으로는 모형이나 가설에 대한 좋은 근거 척도가 되지 못한다.',
]

/** 혼합 절차의 재료 */
export const HYBRID = {
  fisher: ['귀무가설 H₀', 'p-값 계산', '"유의하다"는 표현', '0.05라는 관례적 기준'],
  np: ['대립가설 H₁', '사전에 정한 유의수준 α', '기각역과 "기각/채택" 판정', '제1종·제2종 오류, 검정력'],
  hybrid: ['H₀와 H₁을 세운다', 'α = 0.05로 정한다', '자료에서 p-값을 계산한다', 'p ≤ α이면 "유의하다, H₀ 기각"', '아니면 "유의하지 않다"'],
}
