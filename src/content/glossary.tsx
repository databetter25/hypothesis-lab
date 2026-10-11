// 용어사전 (PRD v3 F13). 교재 정의는 문장을 옮기지 않고 요지를 적고, 위치(정의·식 번호·쪽)를 밝힌다.
import type { ReactNode } from 'react'
import { Tex } from '../components/ui'

export type GlossaryCat = 'basic' | 'error' | 'optimal' | 'lr' | 'interp' | 'sim'

export const GLOSSARY_CATS: { id: GlossaryCat; label: string }[] = [
  { id: 'basic', label: '기본 개념' },
  { id: 'error', label: '오류와 성능' },
  { id: 'optimal', label: '검정함수와 최적성' },
  { id: 'lr', label: '가능도와 가능도비' },
  { id: 'interp', label: '해석과 역사' },
  { id: 'sim', label: '시뮬레이션' },
]

export interface GlossaryEntry {
  id: string
  ko: string
  en: string
  symbol?: string
  cat: GlossaryCat
  /** 쉬운 설명 (1~2문장, 미리보기에도 쓰임) */
  easy: string
  def: ReactNode
  ref: string
  myth: { wrong: string; right: string }
  links?: { to: string; label: string }[]
  related?: string[]
}

export const GLOSSARY: GlossaryEntry[] = [
  /* ---------- 기본 개념 ---------- */
  {
    id: 'null-hypothesis',
    ko: '귀무가설',
    en: 'null hypothesis',
    symbol: 'H₀',
    cat: 'basic',
    easy: '기본으로 두고 의심해 보는 주장입니다. 보통 "차이가 없다", "효과가 없다"는 형태입니다.',
    def: <>대립가설에 반대되는 가설. 검정은 H₀가 참이라고 가정하고, 그 가정 아래에서 관측 결과가 얼마나 드문지를 따집니다.</>,
    ref: '교재 정의 7.1② · p.258, 263',
    myth: { wrong: 'H₀를 기각하지 못했으니 H₀가 참이다.', right: '현재 자료와 규칙으로는 기각할 충분한 근거를 얻지 못했을 뿐이다.' },
    links: [{ to: '/learn/1', label: '안내 학습 1단계' }],
    related: ['alternative-hypothesis', 'simple-composite', 'p-value'],
  },
  {
    id: 'alternative-hypothesis',
    ko: '대립가설',
    en: 'alternative hypothesis',
    symbol: 'H₁',
    cat: 'basic',
    easy: '자료로 입증하고 싶은 주장입니다. 귀무가설과 겹치지 않는 모수 영역을 가리킵니다.',
    def: <>입증하려는 가설. 방향에 따라 우측(θ &gt; θ₀), 좌측(θ &lt; θ₀), 양측(θ ≠ θ₀)이 있습니다.</>,
    ref: '교재 정의 7.1① · p.258, 263',
    myth: { wrong: '대립가설은 언제나 하나의 값이다.', right: 'θ > θ₀처럼 여러 값을 포함하는 복합가설인 경우가 많다. 검정력도 그 값마다 다르다.' },
    links: [{ to: '/lab/pvalue?model=coin', label: 'p-값 실험에서 방향 바꾸기' }],
    related: ['null-hypothesis', 'simple-composite', 'ump'],
  },
  {
    id: 'simple-composite',
    ko: '단순가설·복합가설',
    en: 'simple / composite hypothesis',
    cat: 'basic',
    easy: '가설이 분포를 하나로 정하면 단순가설, 여러 분포를 허용하면 복합가설입니다.',
    def: (
      <>
        H₀: θ = θ₀는 단순가설, H₁: θ ≠ θ₀나 H₀: θ ≤ θ₀는 복합가설입니다. 네이만–피어슨 보조정리는 단순 대 단순에 쓰고, 복합가설에는 가능도비검정을 씁니다.
      </>
    ),
    ref: '교재 7.2 · p.263; 7.3 · p.270',
    myth: { wrong: 'H₀: θ ≤ θ₀도 θ₀ 하나만 보면 되는 단순가설이다.', right: '복합가설이다. 크기는 Ω₀ 전체에서의 최대 기각 확률(sup)로 정의한다. 검정력함수가 증가하면 그 값이 π(θ₀)일 뿐이다.' },
    related: ['np-lemma', 'lrt', 'size'],
  },
  {
    id: 'test-statistic',
    ko: '검정통계량',
    en: 'test statistic',
    symbol: 'T(X)',
    cat: 'basic',
    easy: '판정에 쓰는 표본의 요약값입니다. 동전에서는 앞면 수, 정규 평균에서는 Z입니다.',
    def: (
      <>
        가능도비가 어떤 통계량 T의 단조함수이면, 기각역을 {'{'}T &gt; k′{'}'} 또는 {'{'}|T| &gt; k′{'}'} 꼴로 바꿔 쓸 수 있습니다. 이 T를 검정통계량이라 합니다.
      </>
    ),
    ref: '교재 식 7.7~7.8 · p.266~267',
    myth: { wrong: '검정통계량은 편한 것을 아무거나 고르면 된다.', right: '어떤 통계량이 좋은지는 가능도비가 알려 준다. Fisher의 유의성 검정이 받은 비판도 이 지점이었다.' },
    links: [{ to: '/math#mlr', label: '수리적 원리 §6' }],
    related: ['likelihood-ratio', 'rejection-region', 'sufficient-statistic'],
  },
  {
    id: 'rejection-region',
    ko: '기각역',
    en: 'rejection (critical) region',
    symbol: 'R',
    cat: 'basic',
    easy: '관측값이 여기에 들어가면 H₀를 기각하는, 미리 정한 값들의 모임입니다.',
    def: <>귀무가설을 기각하는 관측값의 영역. 검정을 실시한다는 것은 기각역을 정하는 것과 같습니다.</>,
    ref: '교재 정의 7.1④ · p.259',
    myth: { wrong: 'α를 정하면 기각역은 하나로 정해진다.', right: '같은 크기의 기각역이 여러 개 있을 수 있고 검정력은 크게 다르다. 예: 동전 {X ≥ 15}와 {X ≤ 5}.' },
    links: [
      { to: '/lab/np?model=table&f0=.4,.3,.2,.1&f1=.2,.2,.3,.3&a=0.1', label: '기각역 직접 설계' },
      { to: '/learn/6', label: '안내 학습 6단계' },
    ],
    related: ['acceptance-region', 'critical-value', 'mp-test'],
  },
  {
    id: 'acceptance-region',
    ko: '채택역',
    en: 'acceptance region',
    symbol: 'A(θ₀)',
    cat: 'basic',
    easy: '기각역의 나머지, 즉 H₀를 기각하지 못하는 관측값의 영역입니다.',
    def: (
      <>
        유의수준 α의 채택역을 A(θ₀)라 하면, 모수에 대한 100(1−α)% 신뢰구간은 H₀: θ = θ₀를 기각하지 못하는 θ₀의 집합과 같습니다.
        <Tex block>{String.raw`C(\mathbf x)=\{\theta_0:\ \mathbf x\in A(\theta_0)\}`}</Tex>
      </>
    ),
    ref: '교재 8.7 · 식 8.59~8.61 · p.323',
    myth: { wrong: '관측값이 채택역에 들면 H₀가 입증된다.', right: '"채택"은 기각하지 못했다는 뜻이다. NP 관점에서도 믿음이 아니라 행동의 선택이다.' },
    links: [{ to: '/lab/ci?model=coin', label: '신뢰띠로 보기' }],
    related: ['rejection-region', 'confidence-interval', 'hypothesis-test'],
  },
  {
    id: 'confidence-interval',
    ko: '신뢰구간',
    en: 'confidence interval',
    symbol: 'C(x)',
    cat: 'basic',
    easy: '자료로 만든, 모수를 포함하리라 기대하는 구간입니다. 유의수준 α 검정에서 기각하지 못하는 가설값들의 모임과 같습니다.',
    def: (
      <>
        포함확률 P<sub>θ</sub>(θ ∈ C(X)) ≥ 1 − α를 모든 θ에서 만족하는 구간. 검정과의 쌍대성은 다음과 같습니다.
        <Tex block>{String.raw`\theta_0\in C(\mathbf x)\iff \mathbf x\in A(\theta_0)`}</Tex>
      </>
    ),
    ref: '교재 8.1 · 8.7 · 식 8.59~8.61 · p.322~324',
    myth: { wrong: '계산한 95% 신뢰구간이 θ를 포함할 확률이 95%다.', right: '구간은 표본마다 바뀌고 θ는 고정이다. 이 방법으로 만든 구간들 중 약 95%가 θ를 포함한다는 뜻이다.' },
    links: [
      { to: '/lab/ci?model=coin&n=20&x=14&a=0.05&t0=0.5&ts=0.5', label: '쌍대성 실험 (C01)' },
      { to: '/lab/ci?model=coin&n=20&x=2&a=0.05&t0=0.1&ts=0.1', label: '포함확률 비교 (C03)' },
    ],
    related: ['acceptance-region', 'p-value', 'significance-level'],
  },
  {
    id: 'critical-value',
    ko: '임계값',
    en: 'critical value',
    symbol: 'c',
    cat: 'basic',
    easy: '기각역의 경계값입니다. 예: "x ≥ 15이면 기각"에서 15.',
    def: (
      <>
        이산분포의 우측 검정에서는 크기가 α를 넘지 않는 가장 작은 경계를 고릅니다.
        <Tex block>{String.raw`c=\min\{c:\ P_{\theta_0}(X\ge c)\le\alpha\}`}</Tex>
      </>
    ),
    ref: '교재 예 7.1 · p.260',
    myth: { wrong: '임계값을 쓰면 크기가 정확히 α가 된다.', right: '이산분포에서는 정확히 맞는 c가 없을 수 있다. 동전 n = 20, α = 0.05에서 c = 15이고 실제 크기는 0.0207이다.' },
    links: [{ to: '/lab/pvalue?model=coin&n=20&t0=0.5&x=14&a=0.05&dir=R', label: '자동 임계값 보기 (E02)' }],
    related: ['rejection-region', 'size'],
  },

  /* ---------- 오류와 성능 ---------- */
  {
    id: 'type-1-error',
    ko: '제1종 오류',
    en: 'type I error',
    cat: 'error',
    easy: 'H₀가 참인데 기각하는 오류입니다. 공정한 동전을 편향됐다고 의심하는 경우입니다.',
    def: <Tex block>{String.raw`\alpha=P(\mathbf X\in R\mid H_0)`}</Tex>,
    ref: '교재 정의 7.1⑤ · 식 7.2 · p.259',
    myth: { wrong: 'α는 "이번 결론이 틀렸을 확률"이다.', right: '규칙을 반복 적용할 때 H₀가 참인 경우에 잘못 기각하는 비율의 상한이다.' },
    links: [
      { to: '/lab/errors?model=normal&n=1&t0=0&t1=3&sd=1&dir=R&rule=manual&c=2', label: '교재 예 7.1 실험' },
      { to: '/learn/3', label: '안내 학습 3단계' },
    ],
    related: ['type-2-error', 'significance-level', 'size'],
  },
  {
    id: 'type-2-error',
    ko: '제2종 오류',
    en: 'type II error',
    symbol: 'β(θ)',
    cat: 'error',
    easy: 'H₁이 참인데 기각하지 못하는 오류입니다. 편향된 동전을 놓치는 경우입니다.',
    def: <Tex block>{String.raw`\beta(\theta)=P(\mathbf X\notin R\mid\theta),\quad\theta\in\Omega_1`}</Tex>,
    ref: '교재 정의 7.1⑥ · 식 7.2 · p.259',
    myth: { wrong: 'β는 하나의 값이다.', right: '지정한 대립 모수값마다 달라진다. 동전 규칙 x ≥ 15에서 θ = 0.55이면 약 0.945, θ = 0.9이면 약 0.011이다.' },
    links: [{ to: '/learn/5', label: '안내 학습 5단계' }],
    related: ['type-1-error', 'power'],
  },
  {
    id: 'significance-level',
    ko: '유의수준',
    en: 'significance level',
    symbol: 'α',
    cat: 'error',
    easy: '제1종 오류 확률을 이 값 이하로 묶겠다고 자료를 보기 전에 정하는 기준입니다. 흔히 0.05입니다.',
    def: <>제1종 오류를 범할 확률이 일정한 값 이하가 되도록 정할 때, 그 값을 유의수준이라 합니다.</>,
    ref: '교재 7.1 · p.262',
    myth: { wrong: 'α와 p-값은 같은 종류의 양이다.', right: 'α는 규칙의 성질(미리 정함), p-값은 자료의 성질(관측 후 계산)이다. α를 바꿔도 p-값은 그대로다.' },
    links: [{ to: '/learn/2', label: '안내 학습 2단계' }],
    related: ['size', 'level-alpha-test', 'p-value'],
  },
  {
    id: 'size',
    ko: '크기',
    en: 'size',
    cat: 'error',
    easy: '정한 규칙이 H₀ 아래에서 실제로 기각하는 확률입니다. α는 목표, 크기는 실제 값입니다.',
    def: <Tex block>{String.raw`\text{크기}=\sup_{\theta\in\Omega_0}\pi(\theta)\quad(\text{단순 }H_0\text{이면 }\pi(\theta_0))`}</Tex>,
    ref: '교재 7.1 (교재는 "제1종 오류를 범할 확률"로 표현) · 7.6',
    myth: { wrong: '크기는 곧 α다.', right: '이산분포에서는 α보다 작을 수 있다. 확률화 검정을 쓰면 정확히 α에 맞출 수 있다.' },
    links: [{ to: '/lab/pdist?model=coin&n=20&t0=0.5&ts=0.5&a=0.05&dir=R', label: 'p-값의 분포로 확인 (E09)' }],
    related: ['significance-level', 'level-alpha-test', 'randomized-test'],
  },
  {
    id: 'level-alpha-test',
    ko: '수준 α 검정',
    en: 'level-α test',
    cat: 'error',
    easy: '제1종 오류 확률이 α를 넘지 않는 검정입니다.',
    def: <>제1종 오류를 범할 확률(크기)이 α 이하인 검정. 최강력검정은 이 검정들 사이에서 검정력이 가장 큰 것입니다.</>,
    ref: '교재 정의 7.1⑧ · p.263',
    myth: { wrong: '수준 α 검정이 되려면 크기가 정확히 α여야 한다.', right: '"이하"이면 된다. 크기 0.0207인 동전 규칙도 수준 0.05 검정이다.' },
    related: ['size', 'mp-test'],
  },
  {
    id: 'p-value',
    ko: 'p-값 (유의확률)',
    en: 'p-value, significance probability',
    symbol: 'p',
    cat: 'error',
    easy: 'H₀가 참이라고 가정할 때, 관측값만큼 또는 그보다 극단적인 값이 나올 확률입니다.',
    def: (
      <>
        귀무가설 아래에서 주어진 관측값보다 더 극단적인 값을 얻을 확률. 이산분포에서는 관측값 자신을 포함합니다. 양측 검정에서는 "작은 꼬리 × 2"와 "가능도비 순서" 두 정의가 쓰이며 값이 다를 수 있습니다.
        <Tex block>{String.raw`p(x)=P_{\theta_0}(X\ge x)\quad(\text{우측})`}</Tex>
      </>
    ),
    ref: '교재 정의 7.1③ · p.259, 263',
    myth: { wrong: 'p-값은 H₀가 참일 확률이다.', right: 'H₀를 참이라 가정하고 계산한 자료의 확률이다. 가설의 확률도, 자료가 우연만으로 생겼을 확률도 아니다 (ASA 원칙 2).' },
    links: [
      { to: '/lab/pvalue?model=coin&n=20&t0=0.5&x=14&a=0.05&dir=R', label: 'p-값 실험 (E01)' },
      { to: '/lab/lrt?model=coin&n=20&t0=0.2&a=0.05&x=8', label: '두 양측 정의 비교 (E08)' },
    ],
    related: ['significance-level', 'significance-test', 'statistical-significance'],
  },
  {
    id: 'power',
    ko: '검정력·검정력함수',
    en: 'power, power function',
    symbol: 'π(θ)',
    cat: 'error',
    easy: '실제로 차이가 있을 때 그것을 찾아낼(H₀를 기각할) 확률입니다. 실제 θ마다 값이 다릅니다.',
    def: <Tex block>{String.raw`\text{검정력}=1-\beta=P(\mathbf X\in R\mid H_1),\qquad \pi(\theta)=P_\theta(\mathbf X\in R)`}</Tex>,
    ref: '교재 정의 7.1⑦ · 식 7.3 · 프로그램 7.3 · p.259, 289',
    myth: { wrong: '관측 효과로 계산한 "사후 검정력"이 낮으면 비기각을 설명해 준다.', right: '사후 검정력은 p-값의 변환이라 새 정보가 없다. 검정력은 자료를 모으기 전에 표본크기를 정하는 데 쓴다.' },
    links: [
      { to: '/lab/power?model=normal&n=10&t0=0&ts=1&sd=1&a=0.05&dir=R', label: '검정력 실험 (프로그램 7.3)' },
      { to: '/lab/power?model=coin&n=18&t0=0.5&ts=0.6&a=0.05&dir=R', label: 'n이 늘어도 줄어드는 경우 (E07)' },
    ],
    related: ['type-2-error', 'oc-curve', 'ump'],
  },
  {
    id: 'oc-curve',
    ko: '검사특성곡선',
    en: 'operating characteristic (OC) curve',
    cat: 'error',
    easy: '규칙의 성능을 한 곡선으로 그린 것입니다. 교재와 일반 문헌에서 쓰는 뜻이 다릅니다.',
    def: (
      <>
        <strong>교재의 용법</strong>: 임계값 c를 움직일 때 (제1종 오류 확률, 검정력)이 그리는 곡선(그림 7.3). <strong>일반적 용법</strong>: 모수 θ에 따른 채택확률 1 − π(θ)의 곡선. 두 용법 모두 알아 두세요.
      </>
    ),
    ref: '교재 그림 7.3 · p.262',
    myth: { wrong: '검사특성곡선은 한 가지 뜻뿐이다.', right: '교재는 (α, 검정력) 곡선을, 품질관리 등 일반 문헌은 θ에 따른 채택확률 곡선을 가리키는 경우가 많다.' },
    links: [{ to: '/lab/errors?model=normal&n=1&t0=0&t1=3&sd=1&dir=R&rule=manual&c=2', label: '두 오류 실험의 세 번째 그래프' }],
    related: ['power', 'type-1-error'],
  },

  /* ---------- 검정함수와 최적성 ---------- */
  {
    id: 'test-function',
    ko: '검정함수',
    en: 'test function',
    symbol: 'φ(x)',
    cat: 'optimal',
    easy: '관측값 x를 보았을 때 H₀를 기각할 확률입니다. 보통의 검정은 0(유지) 또는 1(기각)만 씁니다.',
    def: (
      <>
        귀무가설을 기각할 확률을 나타낸 함수. 크기와 검정력이 기댓값으로 표현됩니다.
        <Tex block>{String.raw`\alpha=E[\varphi(X)\mid H_0],\qquad \text{검정력}=E[\varphi(X)\mid H_1]`}</Tex>
      </>
    ),
    ref: '교재 7.6 · 식 7.34~7.36 · p.284~285',
    myth: { wrong: '검정함수는 모수별 기각 확률이다.', right: '검정함수는 관측값별, 검정력함수 π(θ)는 모수별 기각 확률이다.' },
    links: [
      { to: '/lab/np?model=table&f0=.10,.20,.25,.10,.35&f1=.25,.15,.20,.10,.30&a=0.15', label: '교재 표 7.3 실험' },
      { to: '/learn/8', label: '안내 학습 8단계' },
    ],
    related: ['randomized-test', 'power'],
  },
  {
    id: 'randomized-test',
    ko: '확률화 검정',
    en: 'randomized test',
    cat: 'optimal',
    easy: '경계에 있는 관측값에서 정해진 확률 γ로만 기각하는 검정입니다. 이산분포에서 크기를 α에 정확히 맞출 때 씁니다.',
    def: <>0 &lt; φ(x) &lt; 1인 값이 있는 검정. 교재 표 7.3에서 α = 0.15이면 φ(0) = 1, φ(3) = 0.5입니다. 재표집(순열) 검정(randomization test)과는 다른 개념입니다.</>,
    ref: '교재 7.6 · p.285',
    myth: { wrong: '확률화 검정은 실제로 동전을 던져 결정하라는 실무 처방이다.', right: '크기를 α에 맞추고 최적성을 깔끔하게 진술하기 위한 이론적 장치로 이해하는 것이 좋다.' },
    links: [{ to: '/lab/np?model=coin&n=20&t0=0.5&t1=0.7&a=0.05', label: '동전 γ 확인 (E05)' }],
    related: ['test-function', 'np-lemma', 'size'],
  },
  {
    id: 'mp-test',
    ko: '최강력검정',
    en: 'most powerful test',
    cat: 'optimal',
    easy: '같은 α 안에서 차이를 가장 잘 찾아내는 검정입니다.',
    def: <>기각역 R이 (1) P(X ∈ R | H₀) ≤ α이고 (2) 크기 ≤ α인 모든 R*에 대해 P(X ∈ R | H₁) ≥ P(X ∈ R* | H₁)이면, R은 유의수준 α의 최강력검정입니다.</>,
    ref: '교재 정의 7.2 · p.264',
    myth: { wrong: '크기가 같으면 다 같은 검정이다.', right: '크기가 같아도 검정력은 크게 다르다. 동전 θ₁ = 0.7에서 {X ≥ 15}는 0.416, {X ≤ 5}는 0.00004.' },
    links: [{ to: '/learn/6', label: '안내 학습 6단계' }],
    related: ['np-lemma', 'ump', 'level-alpha-test'],
  },
  {
    id: 'np-lemma',
    ko: '네이만–피어슨 보조정리',
    en: 'Neyman–Pearson lemma',
    cat: 'optimal',
    easy: '단순 대 단순 가설에서는 가능도비 f₁/f₀가 큰 값부터 기각역에 넣는 것이 최강력이라는 정리입니다.',
    def: (
      <>
        <Tex block>{String.raw`R=\left\{\mathbf x:\ \frac{f(\mathbf x\mid\theta_1)}{f(\mathbf x\mid\theta_0)}>k\right\},\quad P(\mathbf X\in R\mid H_0)=\alpha\ \Rightarrow\ R\text{는 최강력}`}</Tex>
        이산분포에서는 경계에서 확률화합니다(Neyman & Pearson, 1933).
      </>
    ),
    ref: '교재 정리 7.1 · 예 7.2 · p.264~266',
    myth: { wrong: '복합가설에도 그대로 적용된다.', right: '단순 대 단순 가설의 정리다. 복합 대립에서는 단조가능도비가 있을 때 UMP로 확장되고, 그렇지 않으면 가능도비검정을 쓴다.' },
    links: [
      { to: '/math#np-lemma', label: '증명 (수리적 원리 §5)' },
      { to: '/learn/7', label: '안내 학습 7단계' },
    ],
    related: ['mp-test', 'likelihood-ratio', 'mlr'],
  },
  {
    id: 'mlr',
    ko: '단조가능도비',
    en: 'monotone likelihood ratio (MLR)',
    cat: 'optimal',
    easy: 'θ₁ > θ₀일 때 가능도비가 어떤 통계량의 증가함수가 되는 성질입니다. 이항, 정규, 포아송이 이 성질을 가집니다.',
    def: <Tex block>{String.raw`\theta_1>\theta_0\ \Rightarrow\ \frac{f(x\mid\theta_1)}{f(x\mid\theta_0)}\ \text{가 } T(x)\text{의 비감소함수}`}</Tex>,
    ref: '심화 (교재 범위 밖) · 위키백과 UMP',
    myth: { wrong: '모든 분포족이 이 성질을 가진다.', right: 'w(θ)가 증가하는 1모수 지수족 등에서 성립한다. 성립하지 않으면 단측 UMP도 보장되지 않는다.' },
    links: [{ to: '/math#mlr', label: '그림으로 보기 (수리적 원리 §6)' }],
    related: ['ump', 'np-lemma'],
  },
  {
    id: 'ump',
    ko: '균일최강력검정',
    en: 'uniformly most powerful (UMP) test',
    cat: 'optimal',
    easy: '복합 대립가설의 모든 값에서 동시에 최강력인 검정입니다.',
    def: <>단조가능도비가 있으면 T &gt; t₀ 꼴의 검정이 H₀: θ ≤ θ₀ 대 H₁: θ &gt; θ₀의 UMP입니다(Karlin–Rubin). 양측 대립 θ ≠ θ₀에는 일반적으로 UMP가 없습니다.</>,
    ref: '심화 (교재 범위 밖) · 위키백과 UMP',
    myth: { wrong: '가장 좋은 검정은 언제나 존재한다.', right: '양측 대립에서는 θ₁ > θ₀와 θ₁ < θ₀의 최강력 기각역이 반대쪽에 있어 UMP가 없다.' },
    links: [
      { to: '/lab/np?model=coin&n=20&t0=0.5&t1=0.9&a=0.05', label: 'θ₁ 슬라이더로 확인 (E10)' },
      { to: '/math#no-ump', label: 'UMP가 없다는 증명' },
    ],
    related: ['mlr', 'mp-test', 'lrt'],
  },

  /* ---------- 가능도와 가능도비 ---------- */
  {
    id: 'likelihood',
    ko: '가능도',
    en: 'likelihood',
    symbol: 'L(θ; x)',
    cat: 'lr',
    easy: '관측한 자료를 고정해 두고, 모수 θ를 바꿔 가며 "이 θ라면 이 자료가 얼마나 그럴듯한가"를 잰 함수입니다.',
    def: <Tex block>{String.raw`L(\theta;\mathbf x)=f(\mathbf x\mid\theta)\quad(\mathbf x\text{ 고정, }\theta\text{가 변수})`}</Tex>,
    ref: '교재 5.4 최대가능도추정량',
    myth: { wrong: '가능도는 θ가 참일 확률이다.', right: 'θ에 대한 확률분포가 아니다. θ에 대해 적분해도 1이 되지 않는다.' },
    links: [{ to: '/math#likelihood', label: '가능도 곡선 (수리적 원리 §1)' }],
    related: ['likelihood-ratio', 'sufficient-statistic'],
  },
  {
    id: 'likelihood-ratio',
    ko: '가능도비',
    en: 'likelihood ratio',
    cat: 'lr',
    easy: '두 모수값(또는 두 가설) 아래에서 같은 자료의 가능도를 나눈 값입니다.',
    def: (
      <>
        보조정리에서는 <Tex>{String.raw`f(\mathbf x\mid\theta_1)/f(\mathbf x\mid\theta_0)`}</Tex>(대립/귀무, 클수록 H₁ 지지), 가능도비검정에서는 <Tex>{String.raw`\Lambda=f(\mathbf x\mid\hat\theta_0)/f(\mathbf x\mid\hat\theta)`}</Tex>(귀무/전체, 작을수록 H₀에 불리)를 씁니다.
      </>
    ),
    ref: '교재 정리 7.1 · 식 7.10~7.11, 7.20 · p.265, 270~272',
    myth: { wrong: '가능도비는 늘 같은 방향으로 쓴다.', right: '두 정리에서 분자·분모가 반대다. 기각 방향도 "크면"과 "작으면"으로 반대가 된다.' },
    related: ['likelihood', 'np-lemma', 'lrt'],
  },
  {
    id: 'lrt',
    ko: '가능도비검정',
    en: 'likelihood ratio test (LRT)',
    symbol: 'Λ',
    cat: 'lr',
    easy: '각 가설 아래에서 가장 그럴듯한 모수값을 고른 뒤, 두 최대가능도의 비가 작으면 H₀를 기각하는 검정입니다.',
    def: <Tex block>{String.raw`\Lambda(\mathbf x)=\frac{\max_{\theta\in\Omega_0}f(\mathbf x\mid\theta)}{\max_{\theta\in\Omega}f(\mathbf x\mid\theta)},\qquad R=\{\Lambda(\mathbf x)<k'\}`}</Tex>,
    ref: '교재 정의 7.3 · 예 7.6~7.8 · p.272~278',
    myth: { wrong: '가능도비검정은 언제나 최강력이다.', right: '복합가설에 쓰는 일반적 구성법일 뿐 최강력이 보장되지는 않는다. 정규 평균에서는 |Z| 검정이 된다(예 7.6).' },
    links: [
      { to: '/lab/lrt?model=normal', label: '정규 LRT 실험' },
      { to: '/learn/10', label: '안내 학습 10단계' },
    ],
    related: ['likelihood-ratio', 'wilks', 'ump'],
  },
  {
    id: 'wilks',
    ko: '−2 log Λ와 Wilks 정리',
    en: "Wilks' theorem",
    cat: 'lr',
    easy: '표본이 크면 H₀ 아래에서 −2 log Λ가 근사적으로 χ²분포를 따른다는 결과입니다.',
    def: <Tex block>{String.raw`-2\log\Lambda\ \dot\sim\ \chi^2_r,\quad r=(\text{전체에서 추정하는 모수 수})-(\text{H}_0\text{에서 추정하는 모수 수})`}</Tex>,
    ref: '교재 정리 7.2 · 식 7.22~7.23 · p.279',
    myth: { wrong: 'χ² 근사는 항상 정확하다.', right: '점근 결과다. 동전 n = 10, θ₀ = 0.5에서 χ² 기각역의 실제 크기는 0.109다. 정규 평균에서는 정확히 χ²₁이다.' },
    links: [
      { to: '/lab/lrt?model=coin&n=10&t0=0.5&a=0.05&x=5', label: 'Wilks 근사 점검 (W01)' },
      { to: '/math#wilks', label: '증명 스케치' },
    ],
    related: ['lrt'],
  },
  {
    id: 't-test',
    ko: 't검정',
    en: "Student's t-test",
    symbol: 'T',
    cat: 'lr',
    easy: '모표준편차 σ를 모를 때 표본표준편차 s로 대신해 평균을 검정합니다. 통계량은 정규분포보다 꼬리가 두꺼운 t분포를 따릅니다.',
    def: (
      <>
        한 표본: T = √n(X̄ − μ₀)/S ~ t(n − 1). 두 표본(등분산): 합동분산 Sₚ²을 쓰고 자유도는 n₁ + n₂ − 2입니다. 둘 다 가능도비검정에서 유도됩니다.
        <Tex block>{String.raw`-2\log\Lambda=n\log\!\left(1+\frac{t^2}{n-1}\right)`}</Tex>
      </>
    ),
    ref: '교재 예 7.7 · 예 7.8 · 프로그램 7.2 · p.274~278, 288',
    myth: { wrong: 'σ를 s로 바꿔도 임계값은 z(1.96)를 그대로 써도 된다.', right: '표본이 작으면 크기가 부푼다. n = 10이면 실제 크기가 약 0.082다(교재 프로그램 7.2).' },
    links: [
      { to: '/lab/ttest?model=t1&n=10&x=0.3&sd=1&t0=0&ts=0&sig=1&a=0.05&dir=two&B=10000', label: '프로그램 7.2 재현' },
      { to: '/lab/ttest?model=t2', label: '두 표본 t검정' },
    ],
    related: ['lrt', 'confidence-interval'],
  },
  {
    id: 'chi-square-test',
    ko: 'χ²검정 (Pearson)',
    en: "Pearson's chi-square test",
    symbol: 'X²',
    cat: 'lr',
    easy: '범주별 관측도수와 기대도수의 차이로 분포가 맞는지(적합도), 두 변수가 독립인지(독립성)를 검정합니다.',
    def: (
      <>
        다항분포의 가능도비 G = 2ΣO log(O/E)를 2차로 근사한 것이 Pearson의 X²입니다. 자유도는 적합도에서 K − 1, r×c 분할표 독립성에서 (r − 1)(c − 1)입니다.
        <Tex block>{String.raw`X^2=\sum_i\frac{(O_i-E_i)^2}{E_i}\ \dot\sim\ \chi^2_r`}</Tex>
      </>
    ),
    ref: '교재 7.4 · 식 7.24~7.33 · 예 7.9 · p.279~283',
    myth: { wrong: 'χ²검정은 가능도비검정과 무관한 별개의 방법이다.', right: '가능도비검정의 근사다. 기대도수가 작으면 근사가 나빠지므로 시뮬레이션이나 정확 검정으로 점검한다.' },
    links: [
      { to: '/lab/chisq?model=gof', label: '적합도 검정 실험' },
      { to: '/lab/chisq?model=indep', label: '독립성 검정 실험' },
    ],
    related: ['wilks', 'lrt'],
  },
  {
    id: 'sufficient-statistic',
    ko: '충분통계량',
    en: 'sufficient statistic',
    cat: 'lr',
    easy: '모수에 관한 자료의 정보를 모두 담은 요약값입니다. 동전에서는 앞면 수가 충분통계량입니다.',
    def: <>통계량 T가 주어졌을 때 표본의 조건부 분포가 θ에 의존하지 않으면 T는 충분통계량입니다. 베르누이 표본에서 P(Y = y | X = x) = 1 / C(n, x)입니다.</>,
    ref: '교재 6.6 충분성',
    myth: { wrong: '통계량으로 요약하면 늘 정보를 잃는다.', right: '충분통계량으로 줄이면 θ에 관한 정보는 잃지 않는다.' },
    links: [{ to: '/math#likelihood', label: '수리적 원리 §1' }],
    related: ['likelihood', 'test-statistic'],
  },

  /* ---------- 해석과 역사 ---------- */
  {
    id: 'significance-test',
    ko: '유의성 검정',
    en: 'significance test (Fisher)',
    cat: 'interp',
    easy: 'Fisher의 방법입니다. 귀무가설만 세우고 p-값을 그 가설에 반하는 증거의 강도로 읽습니다.',
    def: <>주어진 가설에 대한 p-값에 바탕을 둔 검정. p-값을 "귀무가설에 대한 반대 증거"로 간주하며, 대립가설과 두 종류의 오류는 다루지 않습니다.</>,
    ref: '교재 7.5 · p.283',
    myth: { wrong: '유의성 검정과 가설검정은 같은 것이다.', right: '철학이 다르다. 오늘날 교과서는 두 방법을 섞어 쓴다(교재 7.5).' },
    links: [{ to: '/history', label: '검정의 역사' }],
    related: ['hypothesis-test', 'nhst', 'p-value'],
  },
  {
    id: 'hypothesis-test',
    ko: '가설검정 (Neyman–Pearson)',
    en: 'hypothesis test',
    cat: 'interp',
    easy: 'H₀와 H₁, α를 미리 정하고 두 오류를 통제하면서 검정력이 가장 큰 규칙을 고르는 방법입니다.',
    def: <>주어진 α에서 대립가설을 고려하여 최적의 기각역을 구하는 방법. α와 β는 같은 기각역으로 검정을 여러 번 반복할 때 각 오류를 범하는 비율로 해석합니다.</>,
    ref: '교재 7.5 · p.283',
    myth: { wrong: 'H₀를 "채택"하면 H₀가 참이라고 믿는 것이다.', right: 'NP의 채택은 믿음이 아니라 행동의 선택이다(귀납적 행동).' },
    links: [{ to: '/learn/12', label: '안내 학습 12단계' }],
    related: ['significance-test', 'nhst', 'type-1-error'],
  },
  {
    id: 'nhst',
    ko: '혼합 검정 (NHST)',
    en: 'null hypothesis significance testing',
    cat: 'interp',
    easy: '오늘날 교과서의 표준 절차입니다. H₀·H₁·α는 NP에서, p-값은 Fisher에서 가져와 "p ≤ α이면 기각"으로 섞었습니다.',
    def: <>1940년 무렵부터 응용 분야, 특히 심리학 교과서에서 정착한 혼합 절차. Fisher도 Neyman–Pearson도 이 형태를 제안하지 않았습니다.</>,
    ref: '교재 7.5 · 조재근(2013)',
    myth: { wrong: 'Fisher나 Neyman–Pearson이 고안한 절차다.', right: '두 방법을 응용 분야에서 섞은 결과다. 섞는 과정에서 두 철학의 전제가 흐려졌다.' },
    links: [{ to: '/history', label: '검정의 역사 05 — 혼합 절차' }],
    related: ['significance-test', 'hypothesis-test'],
  },
  {
    id: 'optional-stopping',
    ko: '선택적 중단 (엿보기)',
    en: 'optional stopping, peeking',
    cat: 'interp',
    easy: '자료를 모으는 중간중간 검정해 보고 유의하면 멈추는 것입니다. 볼 때마다 잘못 기각할 기회가 늘어 실제 크기가 α보다 커집니다.',
    def: <>엿보기 시점과 그때의 기준을 미리 정하고 α를 나눠 쓰면(순차분석) 오류를 통제할 수 있습니다. 동전 100번을 10번 엿보며 매번 α = 0.05로 검정하면 실제 크기는 약 0.143입니다.</>,
    ref: '교재 범위 밖 · 교재 7.5 (반복 비율로서의 α)',
    myth: { wrong: '중간에 몇 번 확인해도 마지막 검정의 α는 그대로다.', right: '멈추는 규칙까지 포함한 전체 절차의 크기를 따져야 한다. 매번 확인하면 크기가 크게 부푼다.' },
    links: [{ to: '/lab/pitfalls?model=seq&n=100&nmin=10&step=10&t0=0.5&ts=0.5&a=0.05', label: '엿보기 실험 (P01)' }],
    related: ['size', 'type-1-error', 'multiple-testing'],
  },
  {
    id: 'multiple-testing',
    ko: '다중검정 (FWER·FDR)',
    en: 'multiple testing, FWER, FDR',
    cat: 'interp',
    easy: '검정을 여러 번 하면 그중 하나라도 우연히 유의하게 나올 확률이 커집니다. 이를 묶는 기준이 FWER와 FDR입니다.',
    def: <>FWER는 하나라도 잘못 기각할 확률로, Bonferroni(α/m)와 Holm이 통제합니다. FDR은 기각한 것 중 잘못 기각한 비율의 기댓값으로, Benjamini–Hochberg가 통제합니다. 귀무가설이 모두 참인 독립 검정 20개를 각각 α = 0.05로 하면 FWER는 1 − 0.95²⁰ ≈ 0.64입니다.</>,
    ref: '교재 범위 밖 · ASA 원칙 4',
    myth: { wrong: '각 검정을 α = 0.05로 했으니 연구 전체의 오류율도 0.05다.', right: '검정 수만큼 기회가 늘어난다. 몇 개를 검정했는지 모두 보고하고 필요하면 보정한다.' },
    links: [{ to: '/lab/pitfalls?model=multi&m=20&m0=15&eff=2.5&a=0.05', label: '다중검정 실험 (P04)' }],
    related: ['type-1-error', 'p-value', 'optional-stopping'],
  },
  {
    id: 'statistical-significance',
    ko: '통계적 유의성',
    en: 'statistical significance',
    cat: 'interp',
    easy: 'p-값이 정한 기준(α) 이하라는 뜻입니다. 효과가 크거나 중요하다는 뜻은 아닙니다.',
    def: <>"통계적으로 유의하다" = p ≤ α. 표본이 크면 아주 작은 차이도 유의해질 수 있으므로, 효과의 크기와 신뢰구간을 함께 보고해야 합니다.</>,
    ref: 'ASA(2016) 원칙 5 · 위키백과',
    myth: { wrong: '통계적으로 유의하므로 효과가 크다.', right: '유의성과 효과의 크기·실질적 중요성은 따로 평가한다.' },
    related: ['p-value', 'power'],
  },

  /* ---------- 시뮬레이션 ---------- */
  {
    id: 'monte-carlo-error',
    ko: '몬테카를로 오차',
    en: 'Monte Carlo error',
    cat: 'sim',
    easy: '시뮬레이션 반복 횟수 B가 유한해서 생기는 추정의 흔들림입니다. B를 늘리면 줄어듭니다.',
    def: (
      <>
        반복 B번 중 k번 기각했다면 추정 비율 q̂ = k/B의 표준오차는 다음과 같습니다. 사이트는 95% Wilson 구간을 함께 표시합니다.
        <Tex block>{String.raw`\mathrm{SE}(\hat q)=\sqrt{\hat q(1-\hat q)/B}`}</Tex>
      </>
    ),
    ref: '교재 1.8 몬테카를로 · 프로그램 7.1',
    myth: { wrong: '표본크기 n을 늘리면 시뮬레이션 오차가 준다.', right: '시뮬레이션 오차는 반복 횟수 B에 달려 있다. n은 한 번의 실험에 쓰는 표본의 크기다.' },
    links: [{ to: '/lab/lrt?model=normal&n=10&t0=0&sd=1&a=0.05&x=0.3&B=10000', label: '교재 프로그램 7.1 재현' }],
    related: ['size'],
  },
]

export const GLOSSARY_BY_ID: Record<string, GlossaryEntry> = Object.fromEntries(GLOSSARY.map((g) => [g.id, g]))
