import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Tex, TextbookBadge } from '../components/ui'
import { LambdaWidget, LikelihoodWidget, MLRWidget, NoUMPWidget, Proof } from '../math/widgets'

interface Sec {
  id: string
  n: number
  title: string
  badge: string
  body: ReactNode
}

const L = (to: string, label: string) => (
  <Link className="btn-ghost" to={to}>
    {label} →
  </Link>
)

const SECTIONS: Sec[] = [
  {
    id: 'likelihood',
    n: 1,
    title: '가능도와 충분통계량',
    badge: '교재 5.4 · 6.6',
    body: (
      <>
        <p className="math-lead">가능도는 자료를 고정하고 모수를 움직이는 함수입니다. 동전 실험에서는 앞면 수 X 하나에 자료의 정보가 모두 담깁니다.</p>
        <p>Y₁, …, Yₙ이 서로 독립이고 각각 Bernoulli(θ)이면, 관측한 배열 y에 대한 가능도는 다음과 같습니다.</p>
        <Tex block>{String.raw`L(\theta;\mathbf y)=\prod_{i=1}^{n}\theta^{y_i}(1-\theta)^{1-y_i}=\theta^{x}(1-\theta)^{n-x},\qquad x=\sum_{i=1}^n y_i`}</Tex>
        <p>
          가능도는 배열 y가 아니라 합 x에만 의존합니다. 앞앞뒤와 앞뒤앞은 같은 가능도를 줍니다. 그래서 X = ΣYᵢ ~ B(n, θ)만 보아도 되고, 이를 <strong>충분통계량</strong>이라 합니다.
        </p>
        <LikelihoodWidget />
        <Proof
          title="충분성"
          summary="X = x가 주어지면 배열의 조건부 분포가 θ와 무관하다."
          steps={[
            <>
              배열 y의 합이 x일 때 <Tex>{String.raw`P_\theta(\mathbf Y=\mathbf y)=\theta^{x}(1-\theta)^{n-x}`}</Tex>
            </>,
            <>
              <Tex>{String.raw`P_\theta(X=x)=\binom{n}{x}\theta^{x}(1-\theta)^{n-x}`}</Tex>
            </>,
            <>
              따라서 <Tex>{String.raw`P_\theta(\mathbf Y=\mathbf y\mid X=x)=1/\binom{n}{x}`}</Tex>로, θ가 사라집니다. X를 안 뒤에는 배열이 θ에 대해 더 알려 주는 것이 없습니다.
            </>,
          ]}
        />
        <Proof
          title="최대가능도추정"
          summary="θ̂ = x/n"
          steps={[
            <Tex key="a">{String.raw`\ell(\theta)=x\log\theta+(n-x)\log(1-\theta)`}</Tex>,
            <Tex key="b">{String.raw`\ell'(\theta)=\frac{x}{\theta}-\frac{n-x}{1-\theta}=0\ \Rightarrow\ \hat\theta=\frac{x}{n}`}</Tex>,
            <>ℓ″(θ) &lt; 0이므로 최대입니다. x = 0이나 n이면 경계에서 최대가 됩니다 (0·log 0 = 0 규약).</>,
          ]}
        />
      </>
    ),
  },
  {
    id: 'test-function',
    n: 2,
    title: '검정함수, 검정력함수, 크기',
    badge: '교재 7.6 · 식 7.34~7.36',
    body: (
      <>
        <p className="math-lead">검정함수 φ는 "관측값별" 기각 확률이고, 검정력함수 π는 "모수별" 기각 확률입니다.</p>
        <Tex block>{String.raw`\varphi:\mathcal X\to[0,1],\qquad \pi_\varphi(\theta)=E_\theta[\varphi(X)]=\sum_x\varphi(x)f(x\mid\theta)`}</Tex>
        <p>기각역 R을 쓰는 보통의 검정은 φ = 1<sub>R</sub>(지시함수)인 특수한 경우입니다. 그러면 π(θ) = P<sub>θ</sub>(X ∈ R)입니다.</p>
        <Tex block>{String.raw`\text{크기}=\sup_{\theta\in\Omega_0}\pi_\varphi(\theta),\qquad \text{수준 }\alpha\text{ 검정}\iff\text{크기}\le\alpha`}</Tex>
        <p>
          단순 H₀: θ = θ₀이면 크기는 π(θ₀)입니다. 복합 H₀: θ ≤ θ₀라도 π가 증가함수이면 크기는 여전히 π(θ₀)입니다(§6). 크기와 α가 같다고 일반적으로 가정하지 않습니다. 이산분포에서는 크기 &lt; α가 흔합니다.
        </p>
        <div className="row">{L('/lab/power?model=coin', '검정력함수 실험')}</div>
      </>
    ),
  },
  {
    id: 'pvalue-rule',
    n: 3,
    title: 'p-값과 기각역은 같은 판정을 낸다',
    badge: '교재 정의 7.1',
    body: (
      <>
        <p className="math-lead">우측 검정에서 "x ≥ c"와 "p(x) ≤ α"는 항상 같은 결론입니다. 사이트는 이 동치를 모든 n ≤ 500에서 자동으로 검사합니다.</p>
        <Tex block>{String.raw`p(x)=P_{\theta_0}(X\ge x),\qquad c=\min\{c:\ P_{\theta_0}(X\ge c)\le\alpha\}`}</Tex>
        <Proof
          title="명제"
          summary="θ₀ ∈ (0,1)이면 모든 x에서 x ≥ c ⇔ p(x) ≤ α."
          steps={[
            <>꼬리확률 t ↦ P(X ≥ t)는 t에 대해 감소합니다.</>,
            <>
              (⇒) x ≥ c이면 <Tex>{String.raw`p(x)=P(X\ge x)\le P(X\ge c)\le\alpha`}</Tex>
            </>,
            <>
              (⇐) x &lt; c, 즉 x ≤ c − 1이면, c의 최소성 때문에 P(X ≥ c − 1) &gt; α이고 <Tex>{String.raw`p(x)\ge P(X\ge c-1)>\alpha`}</Tex>
            </>,
          ]}
        />
        <div className="row">{L('/lab/pvalue?model=coin', 'p-값과 기각역 실험')}</div>
      </>
    ),
  },
  {
    id: 'superuniform',
    n: 4,
    title: 'p-값의 초균등성',
    badge: '교재 7.5 · 프로그램 7.1',
    body: (
      <>
        <p className="math-lead">H₀ 아래에서 p-값은 확률변수이고, 모든 u에 대해 P(p(X) ≤ u) ≤ u입니다. 그래서 "p ≤ α이면 기각"은 수준 α 검정입니다.</p>
        <Proof
          title="정리"
          summary="이산형: P₀(p(X) ≤ u) ≤ u. 연속형: p(X) ~ U(0,1)."
          steps={[
            <>
              u ∈ [0,1]을 고정하고 <Tex>{String.raw`c_u=\min\{c: P_{\theta_0}(X\ge c)\le u\}`}</Tex>라 둡니다.
            </>,
            <>§3의 명제(α 자리에 u)에 의해 사건이 같습니다: {'{'}p(X) ≤ u{'}'} = {'{'}X ≥ c<sub>u</sub>{'}'}.</>,
            <>
              따라서 <Tex>{String.raw`P_{\theta_0}(p(X)\le u)=P_{\theta_0}(X\ge c_u)\le u`}</Tex>
            </>,
            <>
              연속형에서는 통계량 T의 분포함수 F가 연속이고 p = 1 − F(T)입니다. 확률적분변환에 의해 F(T) ~ U(0,1)이므로 <Tex>{String.raw`P(p\le u)=P(F(T)\ge 1-u)=u`}</Tex>입니다.
            </>,
          ]}
        />
        <p className="muted">동전 n = 20, θ₀ = 0.5에서 P(p ≤ 0.05) = 0.0207입니다. 계단 사이에서 등호가 깨집니다.</p>
        <div className="row">{L('/lab/pdist?model=coin', 'p-값의 분포 실험')}</div>
      </>
    ),
  },
  {
    id: 'np-lemma',
    n: 5,
    title: '네이만–피어슨 보조정리',
    badge: '교재 정리 7.1 · 예 7.2 · 7.6',
    body: (
      <>
        <p className="math-lead">단순 대 단순 가설에서는 가능도비가 큰 값부터 기각하는 검정이 최강력입니다. 확률화까지 허용하면 크기를 정확히 α에 맞출 수 있습니다.</p>
        <p>H₀: f = f₀ 대 H₁: f = f₁에 대해, 상수 k ≥ 0과 γ ∈ [0, 1]을 써서 다음 검정을 만듭니다.</p>
        <Tex block>{String.raw`\varphi^*(x)=\begin{cases}1 & f_1(x)>k\,f_0(x)\\ \gamma & f_1(x)=k\,f_0(x)\\ 0 & f_1(x)<k\,f_0(x)\end{cases},\qquad E_0[\varphi^*(X)]=\alpha`}</Tex>
        <p>
          교재 정리 7.1은 연속형에서 R = {'{x : f₁/f₀ > k}'}, P(X ∈ R | H₀) = α인 경우를 다룹니다. 이산형에서 그런 k가 없으면 경계에서 γ를 씁니다(교재 7.6, 표 7.3).
        </p>
        <Proof
          title="보조정리"
          summary="E₀[φ] ≤ α인 모든 검정 φ에 대해 E₁[φ*] ≥ E₁[φ]."
          steps={[
            <>
              <strong>핵심 부등식.</strong> 모든 x에서 <Tex>{String.raw`\{\varphi^*(x)-\varphi(x)\}\{f_1(x)-k f_0(x)\}\ge 0`}</Tex>
            </>,
            <>
              이유: f₁ &gt; kf₀이면 φ* = 1 ≥ φ라서 두 인수가 모두 ≥ 0입니다. f₁ &lt; kf₀이면 φ* = 0 ≤ φ라서 두 인수가 모두 ≤ 0입니다. f₁ = kf₀이면 둘째 인수가 0입니다.
            </>,
            <>
              x에 대해 더하면(연속형은 적분) <Tex>{String.raw`\sum_x(\varphi^*-\varphi)f_1\ \ge\ k\sum_x(\varphi^*-\varphi)f_0`}</Tex>
            </>,
            <>
              즉 <Tex>{String.raw`E_1[\varphi^*]-E_1[\varphi]\ \ge\ k\,(E_0[\varphi^*]-E_0[\varphi])=k\,(\alpha-E_0[\varphi])\ \ge 0`}</Tex>
            </>,
          ]}
        />
        <Proof
          title="k와 γ의 존재"
          summary="가능도비의 분포에서 상위 α 지점을 고르고, 모자라는 만큼 γ로 채운다."
          steps={[
            <>
              H₀ 아래 G(t) = P₀(f₁/f₀ &gt; t)는 t에 대해 감소하고 오른쪽 연속입니다. <Tex>{String.raw`k=\inf\{t: G(t)\le\alpha\}`}</Tex>로 둡니다.
            </>,
            <>그러면 P₀(f₁/f₀ &gt; k) ≤ α ≤ P₀(f₁/f₀ ≥ k)입니다.</>,
            <>
              <Tex>{String.raw`\gamma=\frac{\alpha-P_0(f_1/f_0>k)}{P_0(f_1/f_0=k)}`}</Tex>로 두면 E₀[φ*] = α입니다. 분모가 0이면 γ는 아무 값이나 됩니다.
            </>,
          ]}
        />
        <p className="muted">직관: 크기 α라는 "예산"으로 f₀ 질량을 쓰고 f₁ 질량을 얻습니다. 단위 예산당 얻는 양이 f₁/f₀이므로 그 비가 큰 값부터 고르는 것이 최선입니다.</p>
        <div className="row">
          {L('/lab/np?model=table&f0=.10,.20,.25,.10,.35&f1=.25,.15,.20,.10,.30&a=0.15', '교재 표 7.3으로 확인')}
          {L('/learn/7', '안내 학습 7단계')}
        </div>
      </>
    ),
  },
  {
    id: 'mlr',
    n: 6,
    title: '단조가능도비와 균일최강력검정',
    badge: '심화 · 위키백과 UMP',
    body: (
      <>
        <p className="math-lead">θ₁ &gt; θ₀이면 이항의 가능도비는 x의 증가함수입니다. 그래서 보조정리의 기각역이 θ₁에 의존하지 않고, 단측 대립 전체에서 최강력(UMP)이 됩니다.</p>
        <Tex block>{String.raw`\log\frac{f(x\mid\theta_1)}{f(x\mid\theta_0)}=x\,\log\frac{\theta_1(1-\theta_0)}{\theta_0(1-\theta_1)}+n\log\frac{1-\theta_1}{1-\theta_0}`}</Tex>
        <p>x의 계수는 θ₁ &gt; θ₀일 때 양수, θ₁ &lt; θ₀일 때 음수입니다. 아래 그림에서 실선은 모두 증가하고 점선(θ₁ = 0.3)만 감소합니다.</p>
        <MLRWidget />
        <Proof
          title="이항의 UMP"
          summary="H₀: θ = θ₀ 대 H₁: θ > θ₀에서 'X > k이면 기각, X = k이면 γ'는 UMP다."
          steps={[
            <>임의의 θ₁ &gt; θ₀를 고정합니다. 가능도비가 x의 증가함수이므로, 보조정리 검정은 "x가 큰 값부터" 기각역에 넣는 검정입니다.</>,
            <>그 검정의 k와 γ는 E<sub>θ₀</sub>[φ] = α만으로 정해집니다. θ₁은 쓰이지 않습니다.</>,
            <>따라서 같은 φ가 모든 θ₁ &gt; θ₀에서 최강력입니다. 이것이 균일최강력(UMP)의 정의입니다.</>,
          ]}
        />
        <div className="note blue">
          <strong>Karlin–Rubin 정리 (진술).</strong> 분포족이 통계량 T에 대해 단조가능도비를 가지면, T &gt; t₀(경계 T = t₀에서 γ)인 크기 α 검정은 H₀: θ ≤ θ₀ 대 H₁: θ &gt; θ₀의 UMP 검정입니다. 이때 검정력함수는 증가하므로 크기는 π(θ₀)입니다. f(x|θ) = h(x)c(θ)exp{'{'}w(θ)T(x){'}'}인 지수족에서 w가 증가함수이면 성립합니다. 일반 증명은 다음 출시에서 다룹니다.
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          {L('/lab/np?model=coin&n=20&t0=0.5&t1=0.9&a=0.05', 'θ₁ 슬라이더로 확인 (E10)')}
        </div>
      </>
    ),
  },
  {
    id: 'no-ump',
    n: 7,
    title: '양측 대립에는 UMP가 없다',
    badge: '심화',
    body: (
      <>
        <p className="math-lead">θ₁ &gt; θ₀에서 최강력인 기각역은 오른쪽 꼬리이고, θ₁ &lt; θ₀에서 최강력인 기각역은 왼쪽 꼬리입니다. 하나의 검정이 둘 다일 수는 없습니다.</p>
        <NoUMPWidget />
        <Proof
          title="명제"
          summary="0 < α < 1이면 H₀: θ = θ₀ 대 H₁: θ ≠ θ₀의 수준 α UMP 검정은 존재하지 않는다."
          steps={[
            <>그런 검정 φ가 있다고 가정합니다. θ₁ &gt; θ₀에서 φ는 최강력이어야 하므로, 보조정리의 유일성에 의해 (경계를 빼면) 오른쪽 꼬리 검정 φ<sub>R</sub>과 같아야 합니다.</>,
            <>같은 이유로 θ₂ &lt; θ₀에서는 왼쪽 꼬리 검정 φ<sub>L</sub>과 같아야 합니다.</>,
            <>그러나 φ<sub>R</sub>의 θ₂에서의 검정력은 α보다 작고(검정력함수가 증가), φ<sub>L</sub>의 θ₂에서의 검정력은 α보다 큽니다. 두 검정은 다르므로 모순입니다.</>,
          ]}
        />
        <p className="muted">그래서 양측 대립에서는 "최적"을 포기하고, 합리적인 일반 원리로 검정을 만듭니다. 그것이 가능도비검정입니다. (불편성을 요구하면 UMPU 검정을 찾을 수 있지만 이 사이트의 범위 밖입니다.)</p>
      </>
    ),
  },
  {
    id: 'lrt',
    n: 8,
    title: '가능도비검정',
    badge: '교재 7.3 · 정의 7.3 · 예 7.6',
    body: (
      <>
        <p className="math-lead">각 가설 아래에서 가능도를 최대로 만든 값의 비를 비교합니다. 복합가설에도 쓸 수 있는 일반적 구성법입니다.</p>
        <Tex block>{String.raw`\Lambda(\mathbf x)=\frac{\max_{\theta\in\Omega_0}f(\mathbf x\mid\theta)}{\max_{\theta\in\Omega}f(\mathbf x\mid\theta)}=\frac{f(\mathbf x\mid\hat\theta_0)}{f(\mathbf x\mid\hat\theta)}\in(0,1],\qquad R=\{\Lambda(\mathbf x)<k'\}`}</Tex>
        <p>
          <strong>방향 주의.</strong> 보조정리는 f₁/f₀ &gt; k(대립/귀무)로, 가능도비검정은 귀무/전체 &lt; k′로 씁니다. 교재 식 (7.10)→(7.11)이 분모와 분자를 바꾸는 과정입니다.
        </p>
        <Proof
          title="예 7.6"
          summary="정규 평균(σ 기지)의 양측 LRT는 |Z| ≥ z_{α/2}이다."
          steps={[
            <>Ω₀ = {'{'}θ₀{'}'}, Ω = ℝ. 전체에서의 최대가능도추정값은 θ̂ = x̄입니다.</>,
            <Tex key="a">{String.raw`\Lambda=\frac{\exp\{-\sum(x_i-\theta_0)^2/2\sigma^2\}}{\exp\{-\sum(x_i-\bar x)^2/2\sigma^2\}}=\exp\!\left\{-\frac{n(\bar x-\theta_0)^2}{2\sigma^2}\right\}`}</Tex>,
            <>
              둘째 등호는 <Tex>{String.raw`\sum(x_i-\theta_0)^2=\sum(x_i-\bar x)^2+n(\bar x-\theta_0)^2`}</Tex>에서 나옵니다.
            </>,
            <>Λ는 |x̄ − θ₀|의 감소함수이므로 Λ &lt; k′ ⇔ |Z| &gt; 상수입니다. 크기 α를 맞추면 |Z| ≥ z_α/2입니다.</>,
          ]}
        />
        <Proof
          title="이항 양측"
          summary="log Λ(x) = x log(θ₀/θ̂) + (n−x) log((1−θ₀)/(1−θ̂)), θ̂ = x/n"
          steps={[
            <>분자는 f(x|θ₀), 분모는 f(x|x/n)입니다. 이항계수는 약분됩니다.</>,
            <>Λ는 x가 nθ₀에서 멀어질수록 작아지지만, θ₀ ≠ 0.5이면 좌우가 비대칭입니다.</>,
            <>
              정확 p-값은 "Λ가 관측값 이하인 결과"의 귀무 확률 합입니다: <Tex>{String.raw`p_\Lambda(x)=\sum_{u:\Lambda(u)\le\Lambda(x)}f(u\mid\theta_0)`}</Tex> 일반 교과서의 "작은 꼬리 × 2"와 다를 수 있습니다(E08).
            </>,
          ]}
        />
        <div className="row">
          {L('/lab/lrt?model=normal', '정규 LRT 실험')}
          {L('/lab/lrt?model=coin&n=20&t0=0.2&a=0.05&x=8', '이항 LRT와 두 p-값 (E08)')}
        </div>
      </>
    ),
  },
  {
    id: 'wilks',
    n: 9,
    title: 'Wilks 정리: −2 log Λ의 근사분포',
    badge: '교재 정리 7.2 · 7.4',
    body: (
      <>
        <p className="math-lead">표본이 크면 H₀ 아래 −2 log Λ는 근사적으로 χ²분포를 따릅니다. 자유도는 두 모수공간의 차원 차이입니다.</p>
        <Tex block>{String.raw`-2\log\Lambda(\mathbf X)\ \xrightarrow{d}\ \chi^2_r,\qquad r=\dim\Omega-\dim\Omega_0`}</Tex>
        <p>
          <strong>조건</strong>: 독립 동일분포, 가능도가 매끄러움, θ₀가 모수공간의 <em>내부</em>에 있음, 가설이 내포 관계임(위키백과 Likelihood-ratio test). θ₀가 경계(0이나 1)에 가까우면 근사가 나빠집니다.
        </p>
        <Proof
          title="스케치 (r = 1)"
          summary="로그가능도를 θ̂ 근처에서 2차로 근사하면 −2 log Λ ≈ Z²."
          steps={[
            <Tex key="a">{String.raw`-2\log\Lambda=2\{\ell(\hat\theta)-\ell(\theta_0)\}`}</Tex>,
            <>
              θ̂에서 ℓ′(θ̂) = 0이므로 테일러 전개하면 <Tex>{String.raw`\ell(\theta_0)\approx\ell(\hat\theta)-\tfrac12 nI(\hat\theta)(\hat\theta-\theta_0)^2`}</Tex> (I는 피셔 정보량, 교재 6.9)
            </>,
            <>
              따라서 <Tex>{String.raw`-2\log\Lambda\approx nI(\hat\theta)(\hat\theta-\theta_0)^2=\left\{\sqrt{nI}\,(\hat\theta-\theta_0)\right\}^2`}</Tex>
            </>,
            <>최대가능도추정량의 점근정규성(교재 6.10)에 의해 괄호 안은 근사적으로 N(0,1)이므로 그 제곱은 χ²₁입니다.</>,
          ]}
        />
        <p>
          정규 평균(σ 기지)에서는 −2 log Λ = n(X̄ − θ₀)²/σ² = Z²라서 근사가 아니라 <strong>정확히</strong> χ²₁입니다(교재 연습문제 07). 이항에서는 근사이며, 아래에서 n과 θ₀를 바꿔 χ² 기각역의 실제 크기를 확인할 수 있습니다.
        </p>
        <LambdaWidget />
        <p className="muted">
          다항분포에 이 원리를 적용하고 x log(x/e)를 2차로 근사하면 Pearson의 χ² 통계량 Σ(O − E)²/E가 나옵니다(교재 식 7.28~7.33).
        </p>
        <div className="row">
          {L('/lab/lrt?model=coin&n=10&t0=0.5&a=0.05&x=5', 'Wilks 근사 시뮬레이션 (W01)')}
          {L('/lab/chisq?model=gof', 'χ²검정 모듈 (교재 7.4)')}
        </div>
      </>
    ),
  },
]

export function MathPage() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 50)
    return () => clearTimeout(t)
  }, [hash])
  return (
    <>
      <section className="section" style={{ paddingBottom: 40 }}>
        <div className="container wide">
          <p className="eyebrow">수리적 원리</p>
          <h1 className="section-title">
            왜 그런 검정인가 — <span className="grad-text">아홉 개의 정리</span>
          </h1>
          <p className="desc" style={{ maxWidth: 760 }}>
            가능도에서 출발해 네이만–피어슨 보조정리, 균일최강력검정, 가능도비검정, Wilks 정리까지 차례로 쌓아 갑니다. 증명은 한 줄 요약을 먼저 보이고, 원하면 단계별로 펼칠 수 있습니다.
          </p>
        </div>
      </section>
      <div className="container wide math-layout">
        <nav className="math-toc" aria-label="목차">
          <p className="learn-label">목차</p>
          <ol>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    const el = document.getElementById(s.id)
                    if (!el) return
                    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
                    // 부드러운 스크롤이 동작하지 않는 환경(백그라운드 탭 등)이면 즉시 이동
                    const y0 = window.scrollY
                    setTimeout(() => {
                      if (window.scrollY === y0) el.scrollIntoView({ block: 'start' })
                    }, 400)
                  }}
                >
                  {s.n}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="math-content">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="math-section">
              <p className="eyebrow">§{s.n}</p>
              <h2>{s.title}</h2>
              <div style={{ marginBottom: 14 }}>
                <TextbookBadge>{s.badge}</TextbookBadge>
              </div>
              {s.body}
            </section>
          ))}
        </div>
      </div>
    </>
  )
}
