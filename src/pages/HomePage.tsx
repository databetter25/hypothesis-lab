import { Link } from 'react-router-dom'
import { MODULES } from '../state/labState'

const ICON: Record<string, string> = { pvalue: '🎯', errors: '⚖️', power: '📈', pdist: '🎲', np: '🏆', lrt: '🔭', chisq: '📊', ci: '📏', ttest: '🧪', pitfalls: '⚠️', more: '🧮' }
const DESC: Record<string, string> = {
  pvalue: '홍차 감별, 동전, 정규 평균으로 p-값과 기각역을 직접 움직여 봅니다.',
  errors: '임계값을 옮기며 제1종·제2종 오류의 상충 관계를 봅니다 (교재 그림 7.1~7.3).',
  power: 'θ, n, α, σ에 따라 검정력이 어떻게 변하는지, 표본크기를 어떻게 정하는지 봅니다.',
  pdist: 'p-값도 확률변수입니다. α가 실제로 무엇을 보장하는지 확인합니다.',
  np: '기각역을 직접 설계하고 네이만–피어슨 보조정리, 검정함수, UMP와 비교합니다.',
  lrt: '양측 대립의 가능도비검정과 Wilks 근사가 언제 맞고 틀리는지 봅니다.',
  chisq: '적합도와 분할표 독립성의 χ²검정을 가능도비검정에서 유도하고, 근사를 시뮬레이션으로 점검합니다 (교재 7.4).',
  ci: '신뢰구간은 기각하지 못하는 θ₀의 모임입니다. 신뢰띠와 p-값 함수, 포함확률로 쌍대성을 확인합니다 (교재 8.7).',
  ttest: 'σ를 모를 때의 t검정과 두 표본 t검정입니다. 교재 프로그램 7.2(z 임계값의 함정)를 재현합니다.',
  more: '포아송 평균(교재 예 7.3)과 정규 분산(예 7.5)의 최강력검정을 확률화·검정력함수와 함께 봅니다.',
  pitfalls: '유의할 때까지 엿보기, 검정 여러 번 하기 — 흔한 오용이 실제 크기를 얼마나 부풀리는지 정확히 계산합니다.',
}

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="eyebrow hero-el" style={{ animationDelay: '0.2s' }}>
            통계학의 개념 및 제문제 · 제7장 가설검정
          </p>
          <h1 className="hero-title hero-el" style={{ animationDelay: '0.35s' }}>
            검정, <span className="grad-text">실험으로</span> 이해하기
          </h1>
          <p className="hero-q hero-el" style={{ animationDelay: '0.5s' }}>
            우연한 변동이 있는 자료에서, 잘못 기각할 위험을 통제하면서 차이를 얼마나 잘 발견할 수 있을까?
          </p>
          <div className="btn-row hero-el" style={{ animationDelay: '0.65s' }}>
            <Link className="btn-filled lg" to="/learn">
              안내 학습 시작하기
            </Link>
            <Link className="btn-outline" to="/lab/pvalue">
              자유 실험
            </Link>
            <Link className="btn-outline" to="/textbook">
              교재 예제
            </Link>
          </div>
          <div className="btn-row hero-el" style={{ animationDelay: '0.8s', marginTop: 24 }}>
            <span className="chip">수학 — 정확 계산</span>
            <span className="chip">역사 — Fisher와 Neyman–Pearson</span>
            <span className="chip">시뮬레이션 — 몬테카를로</span>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <p className="eyebrow">01 — 자유 실험</p>
          <h2 className="section-title">
            열한 개의 <span className="grad-text">실험실</span>
          </h2>
          <p className="desc" style={{ marginBottom: 40 }}>
            모든 화면은 그림, 정확값, 시뮬레이션을 나란히 보여 줍니다. 세 값이 몬테카를로 오차 안에서 일치하는지 직접 확인해 보세요.
          </p>
          <div className="card-grid">
            {MODULES.map((m) => (
              <Link key={m.id} to={`/lab/${m.id}`} className="feat-card">
                <div className="feat-icon" aria-hidden>
                  {ICON[m.id]}
                </div>
                <h3>{m.label}</h3>
                <p>{DESC[m.id]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <p className="eyebrow">02 — 세 가지 길</p>
          <h2 className="section-title">수학, 역사, 시뮬레이션</h2>
          <p className="desc">
            교재 1.8절은 통계적 추론을 배우는 세 가지 길을 제시합니다. 수학으로 연역하는 길, 역사와 논쟁으로 이해하는 길, 컴퓨터 시뮬레이션으로 체감하는 길입니다. 이 실험실은 세 길을 한 화면에서 함께 걷도록 만들었습니다.
          </p>
        </div>
      </section>
    </>
  )
}
