// 안내 학습 3장 12단계 콘텐츠 (PRD v3 §6.2~6.4, §20.1 문항 은행).
import type { ReactNode } from 'react'
import { Tex } from '../components/ui'
import { Term } from '../components/Term'
import type { LabState, ModuleId } from '../state/labState'
import { S, T } from './learnValues'

export type ChapterId = 'A' | 'B' | 'C'

export const CHAPTERS: { id: ChapterId; title: string; textbook: string; minutes: number; desc: string }[] = [
  { id: 'A', title: '검정의 논리', textbook: '교재 7.1, 7.5', minutes: 15, desc: '홍차 감별에서 출발해 p-값, 기각역, 두 오류, 그리고 α가 실제로 보장하는 것을 익힙니다.' },
  { id: 'B', title: '좋은 검정', textbook: '교재 7.1 후반, 7.2, 7.6', minutes: 20, desc: '검정력, 최강력검정, 네이만–피어슨 보조정리, 검정함수와 확률화, 균일최강력검정까지 갑니다.' },
  { id: 'C', title: '가능도비검정과 해석', textbook: '교재 7.3, 7.5, 1.7', minutes: 15, desc: '양측 대립의 가능도비검정, Wilks 근사, 그리고 Fisher와 Neyman–Pearson의 두 관점을 정리합니다.' },
]

export interface Experiment {
  label: string
  module: ModuleId
  patch: Partial<LabState>
}

export interface Checkpoint {
  id: string
  q: ReactNode
  options: ReactNode[]
  correct: number
  explain: ReactNode
}

export interface Step {
  n: number
  chapter: ChapterId
  title: string
  question: string
  textbook: string
  misconception: string
  predict: { prompt: string; choices?: string[]; answer: ReactNode }
  experiments: Experiment[]
  observe: ReactNode[]
  explain: ReactNode
  math?: ReactNode
  checkpoints: Checkpoint[]
  /** 실험 대신(또는 함께) 보여 줄 특수 화면 */
  special?: 'evidence-vs-rule'
}

export const STEPS: Step[] = [
  /* ===================== A장 ===================== */
  {
    n: 1,
    chapter: 'A',
    title: '홍차 감별',
    question: '네 잔을 모두 맞히면 감별 능력이 있다고 할 수 있을까?',
    textbook: '교재 7.1 · p.257~258',
    misconception: '"우연히 맞혔을 수도 있으니 아무것도 말할 수 없다"',
    predict: {
      prompt: '감별 능력이 전혀 없는 사람이 8잔 중 "차를 먼저 넣은" 4잔을 그냥 찍어서 모두 맞힐 확률은 얼마쯤일까요?',
      choices: ['약 50%', '약 10%', '약 1~2%', '0.1% 미만'],
      answer: (
        <>
          8잔에서 4잔을 고르는 방법은 70가지이고 그중 정답은 1가지뿐입니다. 따라서 확률은 {S.teaP4Frac} ≈ {S.teaP4}로, <strong>약 1~2%</strong>입니다.
        </>
      ),
    },
    experiments: [{ label: '홍차 감별', module: 'pvalue', patch: { model: 'tea', x: 4, a: 0.05, B: 1000 } }],
    observe: [
      '▶ 실행을 눌러 "무작위 추측"을 1,000번 반복해 보세요. 4잔을 모두 맞히는 비율이 1/70 근처에 모입니다.',
      '관측 정답 수를 3으로 바꿔 보세요. p-값이 어떻게 달라지나요?',
    ],
    explain: (
      <>
        <p>
          Fisher는 "감별 능력이 없다"는 <strong><Term id="null-hypothesis">귀무가설</Term></strong>만 세우고, 그 가정 아래에서 관측 결과(또는 더 극단적인 결과)가 나올 확률을 계산했습니다. 이것이 <strong><Term id="p-value">p-값</Term></strong>입니다.
        </p>
        <p>
          네 잔 모두 정답이면 p = {S.teaP4}입니다. 이 값이 작다는 것은 "귀무가설이 틀렸거나, 아주 드문 일이 일어났다"는 뜻입니다. Fisher는 이를 귀무가설에 대한 <em>반대 증거</em>로 보았습니다. 세 잔만 맞혔다면 P(K ≥ 3) = {S.teaP3}이라 증거가 약합니다.
        </p>
        <p className="muted">이 단계에서는 대립가설도, 두 종류의 오류도 등장하지 않습니다. 그것은 Neyman–Pearson이 덧붙인 생각입니다(12단계).</p>
      </>
    ),
    math: <Tex block>{String.raw`P(K=k)=\frac{\binom{4}{k}\binom{4}{4-k}}{\binom{8}{4}},\qquad P(K=4)=\frac{1}{70}`}</Tex>,
    checkpoints: [
      {
        id: 'Q11',
        q: '네 잔을 모두 맞혔을 때 p-값과 Fisher식 해석으로 가장 알맞은 것은?',
        options: ['p = 1/70. 감별 능력이 있을 확률이 69/70이다.', 'p = 1/70. 감별 능력이 없다는 가설에 대한 반대 증거로 본다.', 'p = 1/16. 우연이라고 보기 어렵다.', 'p = 1/70. 따라서 감별 능력이 증명되었다.'],
        correct: 1,
        explain: 'p-값은 "귀무가설이 참이라면" 이런 결과가 나올 확률입니다. 가설이 참일 확률이 아니며, 증명도 아닙니다.',
      },
    ],
  },
  {
    n: 2,
    chapter: 'A',
    title: '동전과 p-값',
    question: '20번 던져 앞면 14회는 얼마나 드문가?',
    textbook: '교재 정의 7.1③ · p.263',
    misconception: 'p-값 = H₀가 참일 확률',
    predict: {
      prompt: '공정한 동전을 20번 던질 때 앞면이 14회 이상 나올 확률(p-값)은 몇 %쯤일까요?',
      choices: ['약 0.5%', '약 6%', '약 25%', '약 50%'],
      answer: (
        <>
          P(X ≥ 14 | θ = 0.5) = {S.e01p}, 약 <strong>6%</strong>입니다. 위키백과 p-value 문서도 같은 예를 씁니다.
        </>
      ),
    },
    experiments: [{ label: '동전 p-값', module: 'pvalue', patch: { model: 'coin', n: 20, t0: 0.5, x: 14, a: 0.05, dir: 'R', ts: 0.5 } }],
    observe: ['유의수준 α 슬라이더를 0.01에서 0.1까지 움직여 보세요. 기각역(빗금)은 바뀌지만 p-값 카드는 그대로입니다.', '관측값 막대를 눌러 x를 15, 16으로 바꿔 보세요. p-값 영역(점무늬)이 어떻게 줄어드나요?', '방향을 "양측"으로 바꾸면 p-값이 약 두 배가 됩니다.'],
    explain: (
      <>
        <p>
          p-값은 <strong>H₀가 참이라고 가정할 때</strong> 관측값만큼 또는 그보다 극단적인 값을 얻을 확률입니다(교재 정의 7.1③). 우측 대립이면 "극단적"은 "더 큰 값"입니다.
        </p>
        <p>
          x = 14이면 p = {S.e01p} &gt; 0.05이므로 α = 0.05에서 H₀를 기각하지 못합니다. 양측이라면 p = {S.e01two}입니다.
        </p>
        <p>
          <strong><Term id="significance-level">α</Term>는 규칙의 성질, <Term id="p-value">p-값</Term>은 자료의 성질</strong>입니다. 그래서 α를 바꿔도 p-값은 변하지 않습니다.
        </p>
      </>
    ),
    math: <Tex block>{String.raw`p(x)=P(X\ge x\mid\theta_0)=\sum_{u=x}^{n}\binom{n}{u}\theta_0^{u}(1-\theta_0)^{n-u}`}</Tex>,
    checkpoints: [
      {
        id: 'Q1',
        q: `n = 20 공정성 검정에서 x = 14, p-값 ${S.e01p}입니다. "H₀가 참일 확률이 약 5.8%"라는 해석은?`,
        options: ['옳다', '틀리다 — H₀ 아래에서 14회 이상이 나올 확률이다', '틀리다 — H₁이 참일 확률이다', '옳다 — 단, 단측검정일 때만'],
        correct: 1,
        explain: 'p-값은 H₀를 참이라고 가정하고 계산한 자료의 확률입니다. 가설의 확률이 아닙니다 (ASA 원칙 2).',
      },
      {
        id: 'Q2',
        q: 'α를 0.05에서 0.01로 바꾸면 p-값은?',
        options: ['커진다', '작아진다', '변하지 않는다', 'α와 같아진다'],
        correct: 2,
        explain: '바뀌는 것은 기각역(규칙)입니다. p-값은 자료와 H₀만으로 정해집니다.',
      },
    ],
  },
  {
    n: 3,
    chapter: 'A',
    title: '기각역과 두 오류',
    question: '기각역을 옮기면 두 오류는 어떻게 변할까?',
    textbook: '교재 예 7.1 · 그림 7.1~7.3 · p.260~262',
    misconception: '실제 크기 = α',
    predict: {
      prompt: 'X ~ N(θ, 1), H₀: θ = 0 대 H₁: θ = 3, 기각역 {x ≥ c}. c를 2에서 3으로 키우면 α와 β는?',
      choices: ['둘 다 작아진다', 'α는 작아지고 β는 커진다', 'α는 커지고 β는 작아진다', '둘 다 커진다'],
      answer: (
        <>
          c = 2: α = {S.t02alpha}, β = {S.t02beta}. c = 3: α = {S.t02alpha3}, β = {S.t02beta3}. <strong>α는 작아지고 β는 커집니다.</strong>
        </>
      ),
    },
    experiments: [
      { label: '정규 (교재 예 7.1)', module: 'errors', patch: { model: 'normal', n: 1, t0: 0, t1: 3, sd: 1, dir: 'R', rule: 'manual', c: 2 } },
      { label: '동전 (이산)', module: 'errors', patch: { model: 'coin', n: 20, t0: 0.5, t1: 0.7, a: 0.05, dir: 'R' } },
    ],
    observe: ['임계값 c 슬라이더를 움직이며 두 번째 그래프의 α(c), β(c)를 보세요.', '세 번째 그래프(교재가 "검사특성곡선"이라 부르는 곡선)에서 α를 줄이면 검정력도 줄어드는 것을 확인하세요.', '동전 탭에서는 α가 계단처럼 변합니다. α = 0.05로 정한 규칙의 실제 크기가 얼마인지 보세요.'],
    explain: (
      <>
        <p>
          <strong><Term id="type-1-error">제1종 오류</Term></strong>는 H₀가 참인데 기각하는 것, <strong><Term id="type-2-error">제2종 오류</Term></strong>는 H₁이 참인데 기각하지 못하는 것입니다. 기각역을 넓히면 첫째가 늘고 둘째가 줄어듭니다. 두 오류를 동시에 줄이는 기준은 없습니다.
        </p>
        <p>그래서 교재는 "제1종 오류 확률을 α 이하로 묶고, 그 안에서 제2종 오류를 최소로" 하는 기준을 택합니다(<Term id="level-alpha-test">수준 α 검정</Term>, 교재 7.1 끝).</p>
        <p>
          동전처럼 이산분포에서는 α = 0.05에 정확히 맞는 기각역이 없을 수 있습니다. n = 20이면 c = {S.e02c}에서 실제 크기는 {S.e02size}이고, 한 칸 넓힌 x ≥ 14는 {S.e02wider}로 α를 넘습니다.
        </p>
      </>
    ),
    math: <Tex block>{String.raw`\alpha=P(X\in R\mid H_0),\quad \beta=P(X\notin R\mid H_1),\quad \text{검정력}=1-\beta`}</Tex>,
    checkpoints: [
      {
        id: 'Q13',
        q: 'X ~ N(θ, 1), H₀: θ = 0 대 H₁: θ = 3, R = {x ≥ 2}일 때 (α, β)는?',
        options: [`(${S.t02alpha}, ${S.t02beta})`, `(${S.t02beta}, ${S.t02alpha})`, `(${S.t02alpha}, ${S.t02power})`, '(0.05, 0.2)'],
        correct: 0,
        explain: 'α = P(Z ≥ 2), β = P(Z < 2 − 3) = P(Z < −1)입니다 (교재 예 7.1 풀이).',
      },
    ],
  },
  {
    n: 4,
    chapter: 'A',
    title: '반복의 의미',
    question: 'α = 0.05는 무엇을 보장할까?',
    textbook: '교재 7.5 · 프로그램 7.1 · p.283, 287',
    misconception: 'α = 이번 결론이 틀렸을 확률',
    predict: {
      prompt: 'H₀가 참일 때 α = 0.05인 z검정을 10,000번 반복하면 몇 번쯤 기각될까요?',
      choices: ['0번', '약 50번', '약 500번', '약 5,000번'],
      answer: (
        <>
          약 <strong>500번</strong>(5%)입니다. 교재 프로그램 7.1의 실행 결과는 0.0483이었습니다. α는 "규칙을 반복 적용할 때 잘못 기각하는 비율"입니다.
        </>
      ),
    },
    experiments: [
      { label: '정규 반복 (프로그램 7.1)', module: 'lrt', patch: { model: 'normal', n: 10, t0: 0, sd: 1, a: 0.05, x: 0.3, B: 10000 } },
      { label: 'p-값의 분포 (동전)', module: 'pdist', patch: { model: 'coin', n: 20, t0: 0.5, ts: 0.5, a: 0.05, dir: 'R', B: 10000 } },
      { label: 'p-값의 분포 (정규)', module: 'pdist', patch: { model: 'normal', n: 10, t0: 0, ts: 0, sd: 1, a: 0.05, dir: 'R', B: 10000 } },
    ],
    observe: ['첫 탭에서 ▶ 실행 (B = 10,000). 기각 비율이 0.05의 95% 구간에 드나요?', '두 번째, 세 번째 탭에서 p-값의 누적분포를 비교하세요. 정규는 대각선과 겹치고, 동전은 계단 모양으로 대각선 아래에 놓입니다.', 'θ*를 θ₀에서 멀리 옮기면 P(p ≤ α)가 무엇으로 바뀌나요?'],
    explain: (
      <>
        <p>교재 7.5는 Neyman–Pearson 관점에서 α를 "주어진 기각역으로 검정을 여러 번 반복할 때 제1종 오류를 범하는 비율"로 설명합니다. 한 번의 결론이 틀렸을 확률이 아닙니다.</p>
        <p>
          p-값도 자료에 따라 달라지는 <strong>확률변수</strong>입니다. H₀ 아래에서 연속분포면 p-값 ~ U(0,1)이고, 이산분포면 P(p ≤ α) ≤ α입니다. 동전 n = 20에서는 P(p ≤ 0.05) = {S.e02size}입니다.
        </p>
        <p>
          θ* ≠ θ₀이면 P(p ≤ α)는 <strong>검정력</strong>이 됩니다. θ* = 0.7이면 {S.e03power}입니다.
        </p>
      </>
    ),
    math: <Tex block>{String.raw`P_{\theta_0}\big(p(X)\le\alpha\big)\le\alpha\quad(\text{연속형이면 등호})`}</Tex>,
    checkpoints: [
      {
        id: 'Q10',
        q: 'H₀가 참일 때 동전(n = 20, 우측, α = 0.05) 검정을 1만 번 반복했습니다. 기각 비율이 0.05보다 작게 나오는 이유는?',
        options: ['시뮬레이션 오차 때문', '이산분포라 실제 크기가 α보다 작기 때문', '단측검정이라서', 'p-값 계산이 틀려서'],
        correct: 1,
        explain: `α = 0.05로 정한 규칙 X ≥ ${S.e02c}의 실제 크기는 ${S.e02size}입니다. 기각 비율은 그 근처(약 2%)에 모입니다.`,
      },
    ],
  },

  /* ===================== B장 ===================== */
  {
    n: 5,
    chapter: 'B',
    title: '검정력함수',
    question: '표본이 늘면 차이를 더 잘 발견할까?',
    textbook: '교재 식 7.3 · 프로그램 7.3·7.4 · p.259, 289',
    misconception: 'n이 크면 언제나 더 강력하다',
    predict: {
      prompt: '정규 단측 z검정(α = 0.05, σ = 1)에서 실제 차이가 1일 때, n을 1에서 10으로 늘리면 검정력은?',
      choices: ['약 0.26 → 0.94', '약 0.05 → 0.10', '약 0.5 → 0.6', '변하지 않는다'],
      answer: (
        <>
          n = 1: {S.t11n1}, n = 10: {S.t11n10}. <strong>크게 증가</strong>합니다 (교재 프로그램 7.3).
        </>
      ),
    },
    experiments: [
      { label: '정규 검정력 (프로그램 7.3·7.4)', module: 'power', patch: { model: 'normal', n: 10, t0: 0, ts: 1, sd: 1, a: 0.05, dir: 'R' } },
      { label: '동전: 비단조 (E07)', module: 'power', patch: { model: 'coin', n: 18, t0: 0.5, ts: 0.6, a: 0.05, dir: 'R' } },
    ],
    observe: ['정규 탭: "비교에 저장"을 누른 뒤 n을 1, 25로 바꿔 곡선을 겹쳐 보세요.', '정규 탭: 실제 차이 θ* − θ₀ = 0.5일 때 검정력 0.8에 필요한 n 카드를 확인하세요.', `동전 탭: n = 18에서 "비교에 저장" → n을 20으로 바꾸세요. θ* = 0.6에서 검정력이 ${S.e07power18}에서 ${S.e07power20}로 줄어듭니다.`],
    explain: (
      <>
        <p>
          <Term id="power">검정력</Term> π(θ) = P(X ∈ R | θ)는 θ의 <strong>함수</strong>입니다. θ = θ₀에서는 크기이고, 대립 쪽에서는 검정력입니다. 곡선은 n, α, σ, 방향에 따라 달라지며, θ*는 곡선 위의 한 점일 뿐입니다.
        </p>
        <p>
          큰 흐름으로는 n이 커질수록 검정력이 커집니다. 그러나 이산분포에서는 예외가 있습니다. n = 18의 규칙(x ≥ {S.e07c18})은 크기가 {S.e07size18}로 α에 가깝지만, n = 20의 규칙은 크기가 {S.e02size}에 그칩니다. 그 차이 때문에 n = 18이 더 강력합니다.
        </p>
        <p>
          검정력은 <strong>자료를 모으기 전에</strong> 표본크기를 정하는 데 씁니다. 차이 0.5σ를 검정력 0.8로 찾으려면 n ≈ {T.nPlanCeil}입니다. 관측 효과로 계산한 "사후 검정력"은 p-값의 변환이라 새 정보가 없습니다(위키백과 Power).
        </p>
      </>
    ),
    math: <Tex block>{String.raw`\pi(\theta)=1-\Phi\!\left(z_\alpha-\frac{\sqrt n(\theta-\theta_0)}{\sigma}\right),\qquad n\approx\left(\frac{(z_\alpha+z_\beta)\sigma}{\theta^*-\theta_0}\right)^2`}</Tex>,
    checkpoints: [
      {
        id: 'Q4',
        q: `동전 n = 20, 규칙 x ≥ ${S.e02c}. θ* = 0.55와 θ* = 0.9에서 β는?`,
        options: [`둘 다 ${S.e03beta}`, `${S.q4beta055}와 ${S.q4beta09}로 다르다`, '둘 다 0.05', '구할 수 없다'],
        correct: 1,
        explain: 'β는 지정한 대립 모수값마다 달라지는 β(θ)입니다. 차이가 작을수록 놓치기 쉽습니다.',
      },
      {
        id: 'Q7',
        q: 'n을 18에서 20으로 늘렸더니 θ* = 0.6에서 검정력이 줄었습니다. 이유는?',
        options: ['계산 실수', '표본이 늘면 원래 검정력이 줄어든다', '이산성 때문에 실제 크기가 0.048에서 0.021로 줄었다', 'θ*가 θ₀에 너무 가깝다'],
        correct: 2,
        explain: '이산분포에서는 α 이하에서 고를 수 있는 기각역이 띄엄띄엄이라 실제 크기가 n마다 들쭉날쭉합니다.',
      },
    ],
  },
  {
    n: 6,
    chapter: 'B',
    title: '기각역 직접 설계',
    question: '같은 α에서 가장 잘 발견하는 기각역은?',
    textbook: '교재 정의 7.2 · p.264',
    misconception: '크기가 같으면 다 같은 검정',
    predict: {
      prompt: '워크북 확률표 f₀ = (.4, .3, .2, .1), f₁ = (.2, .2, .3, .3). α = 0.1에서 검정력을 가장 크게 하려면 어떤 값을 기각역에 넣을까요?',
      choices: ['{0}', '{3}', '{2}', '{2, 3}'],
      answer: (
        <>
          크기 ≤ 0.1을 지키는 기각역은 ∅과 {'{3}'}뿐이고, 검정력이 더 큰 것은 <strong>{T.t06bestReject}</strong>(검정력 {T.t06bestPower})입니다. {'{2, 3}'}은 크기가 {T.t06r23alpha}로 α를 넘습니다.
        </>
      ),
    },
    experiments: [{ label: '이산 확률표 (워크북)', module: 'np', patch: { model: 'table', f0: ['.4', '.3', '.2', '.1'], f1: ['.2', '.2', '.3', '.3'], a: 0.1, R: '' } }],
    observe: ['막대를 눌러 기각역을 만들고 크기·검정력 카드를 보세요. α를 넘으면 경고가 뜹니다.', '"비확률화 최선" 탭과 비교하세요.', '교재 표 7.3, 2018 기말 문제 버튼으로 다른 표도 시도해 보세요.'],
    explain: (
      <>
        <p>
          <strong><Term id="mp-test">최강력검정</Term></strong>(교재 정의 7.2): 크기 ≤ α인 모든 기각역 R* 중에서 H₁ 아래 검정력 P(X ∈ R | H₁)이 가장 큰 R.
        </p>
        <p>크기가 같아도 검정력은 크게 다를 수 있습니다. 동전 n = 20에서 {'{X ≥ 15}'}와 {'{X ≤ 5}'}는 크기가 같지만, θ₁ = 0.7에서 검정력은 {S.e03power}와 {S.e05leftPower}입니다.</p>
        <p>어떤 값을 먼저 넣어야 할까요? 다음 단계에서 그 답(가능도비)을 봅니다.</p>
      </>
    ),
    checkpoints: [
      {
        id: 'Q14',
        q: '위 워크북 확률표에서 α = 0.1의 최강력검정 기각역은?',
        options: ['{0}', '{3}', '{2, 3}', '{1, 2}'],
        correct: 1,
        explain: 'f₁/f₀가 가장 큰 값은 x = 3(비 3)이고, 그 하나만으로 크기 0.1을 채웁니다 (워크북 연습문제 5).',
      },
      {
        id: 'Q6',
        q: '크기가 같은 {X ≥ 15}와 {X ≤ 5} 중 θ₁ = 0.7(>θ₀ = 0.5)에 대해 나은 것은?',
        options: ['{X ≥ 15} — 가능도비 f₁/f₀가 큰 값들로 이루어져 있다', '{X ≤ 5} — 꼬리가 더 두껍다', '둘이 같다 — 크기가 같으므로', '판단할 수 없다'],
        correct: 0,
        explain: 'θ₁ > θ₀이면 f₁/f₀는 x의 증가함수입니다. 큰 x일수록 H₁을 더 지지합니다.',
      },
    ],
  },
  {
    n: 7,
    chapter: 'B',
    title: '네이만–피어슨 보조정리',
    question: '왜 가능도비가 큰 값부터 넣을까?',
    textbook: '교재 정리 7.1 · 예 7.2~7.4 · p.265~268',
    misconception: '보조정리는 외워야 할 공식일 뿐',
    predict: {
      prompt: '동전 n = 20, H₀: θ = 0.5 대 H₁: θ = 0.7, α = 0.05. 가능도비 f₁/f₀가 가장 큰 x는?',
      choices: ['x = 0', 'x = 10', 'x = 14', 'x = 20'],
      answer: (
        <>
          <strong>x = 20</strong>입니다. f₁/f₀ = (0.7/0.5)ˣ(0.3/0.5)²⁰⁻ˣ는 x의 증가함수입니다. 그래서 기각역은 위쪽 꼬리부터 채워집니다.
        </>
      ),
    },
    experiments: [
      { label: '동전 (E05)', module: 'np', patch: { model: 'coin', n: 20, t0: 0.5, t1: 0.7, a: 0.05, R: '' } },
      { label: '정규 (교재 예 7.4)', module: 'np', patch: { model: 'normal', n: 10, t0: 0, t1: 0.5, sd: 1, a: 0.05 } },
    ],
    observe: ['"보조정리 규칙" 탭의 빗금 위치와 표의 순서를 비교하세요.', '"내가 만든 기각역" 탭에서 {0~5}를 고른 뒤 검정력을 보조정리 규칙과 비교하세요.', '정규 탭에서 기각역이 x̄ ≥ c 꼴(검정통계량 형태)로 바뀌는 것을 확인하세요.'],
    explain: (
      <>
        <p>
          <strong>보조정리(교재 정리 7.1)</strong>: R = {'{x : f(x|θ₁)/f(x|θ₀) > k}'}이고 P(X ∈ R | H₀) = α이면, R은 유의수준 α의 최강력검정입니다.
        </p>
        <p>
          직관: 크기 α라는 "예산"을 f₀ 질량으로 쓰고, 그 대가로 f₁ 질량(검정력)을 얻습니다. 단위 예산당 얻는 것이 f₁/f₀이므로 그 비가 큰 값부터 사는 것이 최선입니다.
        </p>
        <p>
          가능도비가 통계량 T의 단조함수이면 기각역을 T &gt; k′로 바꿔 쓸 수 있습니다(교재 식 7.8). 동전은 X, 정규는 X̄(예 7.4), 포아송은 ΣXᵢ(예 7.3, 감소 방향)입니다.
        </p>
      </>
    ),
    math: (
      <>
        <p>증명 (교재 예 7.2): 보조정리 규칙 φ*와 임의의 수준 α 검정 φ에 대해</p>
        <Tex block>{String.raw`\{\varphi^*(x)-\varphi(x)\}\{f_1(x)-k f_0(x)\}\ge 0\ \Rightarrow\ E_1[\varphi^*]-E_1[\varphi]\ge k\{E_0[\varphi^*]-E_0[\varphi]\}\ge 0`}</Tex>
      </>
    ),
    checkpoints: [
      {
        id: 'Q15',
        q: 'X ~ B(5, θ), H₀: θ = 1/2 대 H₁: θ = 2/3, α = 1/32에서 최강력검정의 기각역은? (교재 연습문제 05)',
        options: ['{x ≥ 4}', '{x = 5}', '{x = 0}', '{x ≤ 1}'],
        correct: 1,
        explain: '가능도비 2ˣ(2/3)⁵은 x의 증가함수이고 P(X = 5 | θ = 1/2) = 1/32이므로 R = {x = 5}입니다.',
      },
    ],
  },
  {
    n: 8,
    chapter: 'B',
    title: '검정함수와 확률화',
    question: 'α에 딱 맞는 기각역이 없으면?',
    textbook: '교재 7.6 · 표 7.3 · p.284~285',
    misconception: '확률화 검정은 실제로 동전을 던져 결정하라는 처방',
    predict: {
      prompt: '교재 표 7.3에서 가능도비 순으로 x = 0(크기 0.10), 그다음 x = 3(f₀ = 0.10)을 넣으면 크기가 0.20이 됩니다. α = 0.15를 맞추려면?',
      choices: ['x = 0만 넣는다 (크기 0.10)', 'x = 0을 넣고 x = 3에서는 확률 1/2로 기각한다', 'x = 0, 3을 모두 넣는다', 'α를 0.10으로 바꾼다'],
      answer: (
        <>
          <strong>x = 3에서 확률 γ = {T.t05gamma}로 기각</strong>합니다. {T.t05phi}. 크기 {T.t05size}, 검정력 {T.t05power}입니다.
        </>
      ),
    },
    experiments: [
      { label: '교재 표 7.3', module: 'np', patch: { model: 'table', f0: ['.10', '.20', '.25', '.10', '.35'], f1: ['.25', '.15', '.20', '.10', '.30'], a: 0.15, R: '' } },
      { label: '동전 γ (E05)', module: 'np', patch: { model: 'coin', n: 20, t0: 0.5, t1: 0.7, a: 0.05, R: '' } },
    ],
    observe: ['"보조정리 규칙 (확률화)" 탭을 누르세요. 표의 φ(x) 열에 1/2가 나타납니다.', '▶ 실행 (B = 10,000): 확률화 판정을 포함한 기각 비율이 0.15에 모이는지 보세요.', `동전 탭에서 x = ${S.e05boundary}의 γ = ${S.e05gamma}를 확인하세요. 검정력은 ${S.e05power}로, 비확률화 규칙(${S.e03power})보다 큽니다.`],
    explain: (
      <>
        <p>
          검정을 기각역 대신 <strong><Term id="test-function">검정함수</Term></strong> φ(x) ∈ [0, 1]로 나타내면, φ(x)는 "x를 관측했을 때 H₀를 기각할 확률"입니다. 크기와 검정력은 각각 E[φ(X) | H₀], E[φ(X) | H₁]입니다(교재 식 7.35, 7.36).
        </p>
        <p>이산분포에서는 경계값에 0과 1 사이의 φ를 주어야 크기를 정확히 α에 맞출 수 있습니다. 연속분포(정규)에서는 그럴 필요가 없습니다.</p>
        <p className="muted">확률화 검정은 실무 처방이라기보다, 최적성을 깔끔하게 진술하기 위한 이론적 장치로 이해하세요.</p>
      </>
    ),
    math: <Tex block>{String.raw`\alpha=E[\varphi(X)\mid H_0]=\sum_x\varphi(x)f_0(x),\qquad \text{검정력}=E[\varphi(X)\mid H_1]=\sum_x\varphi(x)f_1(x)`}</Tex>,
    checkpoints: [
      {
        id: 'Q5',
        q: '검정함수 φ(3) = 0.5는 무엇을 뜻할까요?',
        options: ['θ = 3에서 기각할 확률이 0.5', 'x = 3을 관측하면 확률 0.5로 H₀를 기각', 'x = 3일 확률이 0.5', 'p-값이 0.5'],
        correct: 1,
        explain: '검정함수는 관측값별 기각 확률, 검정력함수 π(θ)는 모수별 기각 확률입니다.',
      },
      {
        id: 'Q16',
        q: '교재 표 7.3에서 α = 0.15인 최강력 검정함수의 검정력은?',
        options: ['0.25', '0.30', '0.35', '0.15'],
        correct: 1,
        explain: '0.25 × 1 + 0.10 × 0.5 = 0.30.',
      },
    ],
  },
  {
    n: 9,
    chapter: 'B',
    title: 'UMP와 그 한계',
    question: 'θ₁을 모르면 어떻게 할까?',
    textbook: '심화 (교재 범위 밖) · 위키백과 Uniformly most powerful test',
    misconception: '가장 좋은 검정은 늘 존재한다',
    predict: {
      prompt: '동전에서 θ₁을 0.6, 0.7, 0.9로 바꾸면 α = 0.05 최강력 기각역도 바뀔까요?',
      choices: ['바뀐다 — θ₁마다 다르다', '바뀌지 않는다', 'θ₁ = 0.9에서만 바뀐다', '알 수 없다'],
      answer: (
        <>
          <strong>바뀌지 않습니다.</strong> 가능도비가 θ₁ &gt; θ₀인 모든 θ₁에서 x의 증가함수라서, "위쪽 꼬리부터"라는 순서가 같기 때문입니다. 따라서 이 검정은 H₁: θ &gt; θ₀ 전체에서 최강력, 즉 <strong>균일최강력(UMP)</strong>입니다.
        </>
      ),
    },
    experiments: [
      { label: '동전 θ₁ 슬라이더 (E10)', module: 'np', patch: { model: 'coin', n: 20, t0: 0.5, t1: 0.7, a: 0.05, R: '' } },
      { label: '정규 θ₁ 슬라이더', module: 'np', patch: { model: 'normal', n: 10, t0: 0, t1: 0.5, sd: 1, a: 0.05 } },
    ],
    observe: ['θ₁ 슬라이더를 0.51에서 0.99까지 움직이세요. 빗금 위치와 γ가 그대로입니다.', 'θ₁을 0.5보다 작게 넘기세요. 기각역이 왼쪽 꼬리로 뒤집힙니다.', '정규 탭에서도 같은 현상을 확인하세요.'],
    explain: (
      <>
        <p>
          <strong><Term id="mlr">단조가능도비(MLR)</Term></strong>: θ₁ &gt; θ₀이면 f(x|θ₁)/f(x|θ₀)가 통계량 T(x)의 증가함수입니다. 이항·정규·포아송 같은 지수족에서 성립합니다. 이때 T &gt; k 꼴의 검정이 단측 대립 전체에서 UMP입니다(Karlin–Rubin 정리).
        </p>
        <p>
          그러나 <strong>양측 대립 θ ≠ θ₀</strong>에서는 θ₁ &gt; θ₀일 때의 최강력 기각역(오른쪽)과 θ₁ &lt; θ₀일 때의 기각역(왼쪽)이 다릅니다. 하나의 검정이 양쪽 모두에서 최강력일 수 없으므로 <strong>UMP가 존재하지 않습니다.</strong>
        </p>
        <p>그렇다면 양측 대립에서는 무엇을 기준으로 할까요? 이것이 C장의 가능도비검정입니다.</p>
      </>
    ),
    checkpoints: [
      {
        id: 'Q8',
        q: 'θ₁ = 0.6, 0.7, 0.9에서 최강력 기각역이 모두 같다는 것의 의미는?',
        options: ['계산 오류다', '단측 대립 θ > θ₀에 대한 UMP 검정이다', '양측 대립에도 UMP가 있다', '검정력도 모두 같다'],
        correct: 1,
        explain: '기각역이 θ₁에 의존하지 않으므로 하나의 검정이 모든 θ > θ₀에서 최강력입니다. 검정력 값 자체는 θ₁마다 다릅니다.',
      },
      {
        id: 'Q9',
        q: 'H₁: θ ≠ θ₀에 UMP가 없는 이유는?',
        options: ['표본이 작아서', 'θ₁ > θ₀와 θ₁ < θ₀에서 최강력 기각역이 서로 반대쪽에 있어서', 'p-값을 두 배로 해야 해서', '이산분포라서'],
        correct: 1,
        explain: '오른쪽 꼬리 기각역은 θ < θ₀에서 검정력이 거의 0이고, 왼쪽 꼬리는 그 반대입니다.',
      },
    ],
  },

  /* ===================== C장 ===================== */
  {
    n: 10,
    chapter: 'C',
    title: '가능도비검정',
    question: '대립가설이 양쪽이면 무엇을 기준으로 할까?',
    textbook: '교재 7.3 · 정의 7.3 · 예 7.6 · p.270~273',
    misconception: 'LRT는 언제나 최강력',
    predict: {
      prompt: '동전 n = 20, H₀: θ = 0.5 대 H₁: θ ≠ 0.5. x = 14와 x = 6 중 어느 쪽이 H₀에 더 불리할까요?',
      choices: ['x = 14', 'x = 6', '똑같다', '알 수 없다'],
      answer: (
        <>
          θ₀ = 0.5에서는 대칭이므로 <strong>똑같습니다</strong>. 둘 다 LRT p-값이 {S.e06p14}입니다. θ₀가 0.5가 아니면 대칭이 깨집니다.
        </>
      ),
    },
    experiments: [
      { label: '정규 양측 (예 7.6)', module: 'lrt', patch: { model: 'normal', n: 10, t0: 1, sd: 1, a: 0.05, x: 1.5 } },
      { label: '동전 양측 (E06)', module: 'lrt', patch: { model: 'coin', n: 20, t0: 0.5, a: 0.05, x: 14 } },
      { label: '두 p-값이 갈리는 경우 (E08)', module: 'lrt', patch: { model: 'coin', n: 20, t0: 0.2, a: 0.05, x: 8 } },
    ],
    observe: ['정규 탭: 관측 x̄를 움직이며 Λ = exp(−z²/2)와 |z|의 관계를 보세요.', `동전 탭: LRT 기각역의 크기(${S.e06size})를 확인하세요.`, `E08 탭: Λ 순서 p-값(${S.e08lrt})과 꼬리×2 p-값(${S.e08two})의 판정이 갈립니다.`],
    explain: (
      <>
        <p>
          <strong><Term id="lrt">가능도비검정</Term>(교재 정의 7.3)</strong>: 각 가설 아래에서 가능도를 최대화한 값의 비 Λ = f(x|θ̂₀)/f(x|θ̂)를 쓰고, Λ &lt; k′이면 기각합니다. 단순가설의 보조정리와 달리 복합가설에도 쓸 수 있는 일반적 구성법입니다.
        </p>
        <p>정규 평균에서는 Λ가 |x̄ − θ₀|의 감소함수라서 결국 |Z| ≥ z_α/2 검정이 됩니다(예 7.6).</p>
        <p>
          이산분포의 양측 p-값은 정의가 둘입니다. 일반 교과서·위키백과의 "작은 꼬리 × 2"와, 가능도비 순서로 "극단"을 정하는 방식입니다. θ₀ = 0.2, x = 8에서는 {S.e08lrt}(기각)와 {S.e08two}(비기각)로 판정이 갈립니다.
        </p>
        <p className="muted">가능도비 기준은 Neyman–Pearson(1928)이 제안했습니다. LRT가 늘 최강력인 것은 아닙니다.</p>
      </>
    ),
    math: <Tex block>{String.raw`\Lambda(\mathbf x)=\frac{\max_{\theta\in\Omega_0}f(\mathbf x\mid\theta)}{\max_{\theta\in\Omega}f(\mathbf x\mid\theta)}=\frac{f(\mathbf x\mid\hat\theta_0)}{f(\mathbf x\mid\hat\theta)},\qquad R=\{\Lambda(\mathbf x)<k'\}`}</Tex>,
    checkpoints: [
      {
        id: 'Q12',
        q: 'θ₀ = 0.2, x = 8에서 두 양측 p-값이 다른 이유는?',
        options: ['계산 오류', '"극단"의 정의(가능도비 순서 대 꼬리 두 배)가 달라서', '표본이 작아서', 'α가 달라서'],
        correct: 1,
        explain: '분포가 비대칭이면 "반대쪽 꼬리에서 얼마나 떨어진 값이 같은 정도로 극단적인가"를 정하는 방식이 결과를 바꿉니다.',
      },
    ],
  },
  {
    n: 11,
    chapter: 'C',
    title: 'Wilks 근사',
    question: '−2 log Λ는 정말 χ²분포를 따를까?',
    textbook: '교재 정리 7.2 · 연습문제 07 · p.279, 294',
    misconception: 'χ² 근사는 항상 정확',
    predict: {
      prompt: '동전 n = 10, θ₀ = 0.5에서 "−2 log Λ > 3.84이면 기각" 규칙의 실제 크기는 얼마쯤일까요? (목표 α = 0.05)',
      choices: ['약 0.01', '약 0.05', '약 0.11', '약 0.5'],
      answer: (
        <>
          실제 크기는 {S.w01}로, 목표의 두 배가 넘습니다(<strong>약 0.11</strong>). 표본이 작으면 근사가 크게 빗나갑니다.
        </>
      ),
    },
    experiments: [
      { label: '동전 n = 10 (W01)', module: 'lrt', patch: { model: 'coin', n: 10, t0: 0.5, a: 0.05, x: 5, B: 10000 } },
      { label: '경계 근처 θ₀ (W04)', module: 'lrt', patch: { model: 'coin', n: 20, t0: 0.1, a: 0.05, x: 2, B: 10000 } },
      { label: '정규: 정확히 χ²₁', module: 'lrt', patch: { model: 'normal', n: 10, t0: 0, sd: 1, a: 0.05, x: 0.3, B: 10000 } },
    ],
    observe: ['▶ 실행 후 −2 log Λ 히스토그램과 χ²₁ 밀도를 비교하세요.', `W 시리즈 버튼으로 n과 θ₀를 바꿔 χ² 기각역의 크기를 비교하세요: n = 20, θ₀ = 0.5에서 ${S.w02}, n = 20, θ₀ = 0.1에서 ${S.w04}, n = 200, θ₀ = 0.1에서 ${S.w05}.`, '정규 탭에서는 크기가 정확히 α입니다. 왜일까요?'],
    explain: (
      <>
        <p>
          <strong>정리 7.2</strong> (<Term id="wilks">Wilks 정리</Term>): 표본이 충분히 크면 H₀ 아래 −2 log Λ는 근사적으로 χ²(r)분포를 따릅니다. 자유도 r = (전체에서 추정하는 모수 수) − (H₀에서 추정하는 모수 수)입니다. 여기서는 r = 1입니다.
        </p>
        <p>정규 평균(σ 기지)에서는 −2 log Λ = n(X̄ − θ₀)²/σ² = Z²이므로 근사가 아니라 정확히 χ²₁입니다(교재 연습문제 07).</p>
        <p>
          이항에서는 근사입니다. n이 작거나 θ₀가 0이나 1에 가까우면 크게 빗나갑니다. 이산성 때문에 n이 커져도 단조롭게 좋아지지는 않습니다. 적용 조건: 큰 표본, 모수가 모수공간의 내부, 내포된 가설(위키백과 Likelihood-ratio test).
        </p>
        <p className="muted">이 원리를 다항분포에 적용하면 Pearson의 χ²검정이 나옵니다(교재 7.4). 자유 실험의 χ²검정 모듈에서 이어서 확인해 보세요.</p>
      </>
    ),
    math: <Tex block>{String.raw`-2\log\Lambda\ \dot\sim\ \chi^2_r,\qquad r=\dim\Omega-\dim\Omega_0;\qquad \text{정규: }-2\log\Lambda=\frac{n(\bar X-\theta_0)^2}{\sigma^2}\sim\chi^2_1`}</Tex>,
    checkpoints: [
      {
        id: 'Q17',
        q: `동전 n = 10, θ₀ = 0.5에서 −2 log Λ > 3.84로 기각하면 실제 크기는 약 ${S.w01}입니다. 그 이유로 가장 알맞은 것은?`,
        options: ['χ²분포 표를 잘못 읽어서', '표본이 작아 χ² 근사가 맞지 않아서', '양측검정이라서', '귀무가설이 틀려서'],
        correct: 1,
        explain: 'Wilks 정리는 점근 결과입니다. 작은 이산 표본에서는 정확한 분포로 계산하는 것이 안전합니다.',
      },
    ],
  },
  {
    n: 12,
    chapter: 'C',
    title: '유의성 검정과 가설검정',
    question: '비기각은 무엇을 말할까? Fisher와 Neyman–Pearson은 무엇이 달랐나?',
    textbook: '교재 7.5 · 1.7 · p.283, 14~18 · 조재근(2013)',
    misconception: '비기각 = H₀ 입증',
    predict: {
      prompt: '동전 20번 중 앞면 14회, α = 0.05에서 H₀를 기각하지 못했습니다. 이 결론을 한 문장으로 써 보세요.',
      answer: (
        <>
          예시: "이 자료와 규칙으로는 동전이 공정하지 않다고 판단할 <strong>충분한 근거를 얻지 못했다</strong>." "동전이 공정함이 입증되었다"는 틀린 해석입니다. 표본이 작으면 실제로 편향되어 있어도 놓치기 쉽습니다(θ = 0.7에서도 기각 확률은 {S.e03power}).
        </>
      ),
    },
    experiments: [],
    special: 'evidence-vs-rule',
    observe: ['아래 전환 버튼으로 같은 동전 자료를 "근거 보기(Fisher)"와 "규칙 성능 보기(NP)"로 번갈아 보세요.', '연표에서 두 접근이 언제, 어떤 문제의식으로 나왔는지 확인하세요.'],
    explain: (
      <>
        <p>
          <strong>Fisher의 <Term id="significance-test">유의성 검정</Term></strong>(1925): 귀무가설만 세우고 p-값을 "귀무가설에 대한 반대 증거"의 강도로 봅니다. 결론은 잠정적이며, 추론의 한 단계입니다.
        </p>
        <p>
          <strong>Neyman–Pearson의 가설검정</strong>(1928, 1933): H₀와 H₁, α를 미리 정하고, 반복 적용할 때 두 오류를 통제하면서 검정력이 최대인 규칙을 고릅니다. "채택"은 믿음이 아니라 <em>행동</em>의 선택입니다(귀납적 행동).
        </p>
        <p>
          두 접근은 철학이 크게 달랐지만, 오늘날 교과서는 "p-값 ≤ α이면 기각"처럼 둘을 섞어 씁니다(<Term id="nhst">혼합 검정</Term>, 교재 7.5). 이 혼합 절차는 특히 심리학 등 응용 분야에서 굳어졌습니다(조재근, 2013).
        </p>
        <p>
          <strong>ASA(2016) 성명</strong>의 요지: p-값은 가설이 참일 확률이 아니고, 효과의 크기나 중요성을 재지 않으며, 그것만으로 결론을 내려서는 안 됩니다.
        </p>
      </>
    ),
    checkpoints: [
      {
        id: 'Q3',
        q: '검정 결과가 비기각입니다. 가장 적절한 결론은?',
        options: ['H₀가 참임이 입증되었다', 'H₀를 채택한다 — H₀가 참이라고 믿는다', '현재 자료와 규칙으로는 H₀를 기각할 충분한 근거가 없다', 'H₁이 틀렸다'],
        correct: 2,
        explain: '비기각은 증거 부족을 뜻할 뿐입니다. NP의 "채택"도 믿음이 아니라 행동의 선택입니다.',
      },
      {
        id: 'Q18',
        q: 'Fisher와 Neyman–Pearson의 차이로 가장 알맞은 것은?',
        options: ['Fisher는 두 종류의 오류를, NP는 p-값만 썼다', 'Fisher는 p-값을 근거의 척도로, NP는 오류를 통제하는 결정 규칙과 최적성을 중시했다', '둘은 같은 방법을 다른 이름으로 불렀다', 'NP는 대립가설 없이 귀무가설만 세웠다'],
        correct: 1,
        explain: 'Fisher: 귀납적 추론, 근거. NP: 귀납적 행동, 오류 통제와 최강력검정 (교재 7.5, KCI 표 1).',
      },
    ],
  },
]

export function stepHref(n: number): string {
  return `/learn/${n}`
}
