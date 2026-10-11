import { Link } from 'react-router-dom'
import { ComparisonTable, EvidenceVsRule, Timeline } from '../history/components'
import { ASA_PRINCIPLES, HYBRID } from '../content/history'
import { TextbookBadge } from '../components/ui'

export function HistoryPage() {
  return (
    <>
      <section className="hero" style={{ paddingBottom: 56 }}>
        <div className="container narrow">
          <p className="eyebrow hero-el" style={{ animationDelay: '0.2s' }}>
            검정의 역사
          </p>
          <h1 className="hero-title hero-el" style={{ animationDelay: '0.35s', fontSize: 'clamp(2.2rem, 6vw, 4rem)' }}>
            "p ≤ 0.05이면 기각"은 <span className="grad-text">어디서 왔나</span>
          </h1>
          <p className="hero-q hero-el" style={{ animationDelay: '0.5s' }}>
            오늘 교과서의 검정 절차는 한 사람의 발명이 아니라, 서로 다른 두 생각이 섞여 굳어진 결과입니다. 출생 성비 연구에서 시작해 Fisher와 Neyman–Pearson의 논쟁, 그리고 응용 분야의 혼합 절차까지 따라가 봅니다.
          </p>
          <div className="btn-row hero-el" style={{ animationDelay: '0.65s' }}>
            <TextbookBadge>교재 1.7 · 7.5</TextbookBadge>
            <span className="textbook-badge">📄 조재근(2013), 수학사학회지 26(4)</span>
          </div>
        </div>
      </section>

      {/* 01 Arbuthnot */}
      <section className="section alt" style={{ padding: '72px 0' }}>
        <div className="container">
          <p className="eyebrow">01 — 최초의 검정</p>
          <h2 className="section-title">82년 연속, 남아가 더 많았다</h2>
          <div className="history-split">
            <div>
              <p className="desc">
                1710년 John Arbuthnot은 런던의 82년치 출생 기록을 살폈습니다. 해마다 남아가 여아보다 많았습니다. 남녀 출생이 반반이라면 82년 모두 남아가 많을 확률은 (1/2)⁸²입니다. 그는 이것이 우연일 수 없다고 결론지었습니다.
              </p>
              <p className="desc" style={{ marginTop: 12 }}>
                귀무가설 아래에서 관측 결과가 나올 확률을 계산해 그 가설을 의심하는 논리는 오늘날의 p-값과 같습니다. 해마다 "남아 초과"를 앞면으로 보면 이것은 동전 모형의 부호검정입니다.
              </p>
            </div>
            <div className="stat-callout">
              <div className="stat-tag">p-값</div>
              <div className="stat-big">
                2<sup>−82</sup>
              </div>
              <div className="field-hint">≈ 2.07 × 10⁻²⁵</div>
              <Link className="btn-filled sm" style={{ marginTop: 16 }} to="/lab/pvalue?model=coin&n=82&t0=0.5&x=82&a=0.05&dir=R">
                동전 모형으로 재현
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 02 연표 */}
      <section className="section" style={{ padding: '72px 0' }}>
        <div className="container">
          <p className="eyebrow">02 — 연표</p>
          <h2 className="section-title">
            1710년부터 <span className="grad-text">2016년까지</span>
          </h2>
          <p className="desc" style={{ marginBottom: 32 }}>
            항목마다 출처와 대조 상태를 표시했습니다. "원문 대조 필요"인 항목은 게시 전에 원 논문과 확인해야 합니다. 관련 실험이 있는 항목은 링크로 바로 열 수 있습니다.
          </p>
          <Timeline grouped />
        </div>
      </section>

      {/* 03 두 관점 */}
      <section className="section alt" style={{ padding: '72px 0' }}>
        <div className="container">
          <p className="eyebrow">03 — 두 관점</p>
          <h2 className="section-title">근거인가, 규칙인가</h2>
          <div className="card-grid" style={{ marginBottom: 32 }}>
            <div className="feat-card">
              <div className="feat-icon" aria-hidden>
                🔬
              </div>
              <h3>Fisher — 유의성 검정</h3>
              <p>
                귀무가설 하나만 세우고, p-값을 그 가설에 대한 반대 증거의 강도로 읽습니다. 검정은 최종 결정이 아니라 추론을 이어 가는 한 단계입니다. 고정된 0.05 기준을 기계적으로 적용하는 것에 반대했고, 자신의 방법을 <strong>귀납적 추론</strong>이라 불렀습니다.
              </p>
            </div>
            <div className="feat-card">
              <div className="feat-icon" aria-hidden>
                ⚖️
              </div>
              <h3>Neyman–Pearson — 가설검정</h3>
              <p>
                두 가설과 α를 미리 정하고, 규칙을 반복 적용할 때의 두 오류를 통제하면서 검정력이 가장 큰 기각역을 찾습니다. "채택"은 믿음이 아니라 행동의 선택이며, 이를 <strong>귀납적 행동</strong>이라 불렀습니다.
              </p>
            </div>
          </div>
          <div className="panel" style={{ marginBottom: 32 }}>
            <ComparisonTable />
          </div>
          <div className="learn-narrow">
            <EvidenceVsRule cases={['coin', 'tea']} label="같은 자료, 두 관점 — 직접 전환해 보기" />
          </div>
        </div>
      </section>

      {/* 04 논쟁과 평가 */}
      <section className="section" style={{ padding: '72px 0' }}>
        <div className="container narrow">
          <p className="eyebrow">04 — 논쟁과 평가</p>
          <h2 className="section-title">대립이었나, 완성이었나</h2>
          <p className="desc">
            처음에는 서로 우호적이었던 두 진영은 논쟁을 거치며 날카롭게 대립했습니다. 논쟁은 주로 Fisher와 Neyman 사이에서 벌어졌고, 최적성뿐 아니라 확률을 어떻게 볼 것인지, 무엇이 과학적 방법인지까지 다투었습니다. Fisher가 세상을 떠난 1962년까지 타협점은 없었습니다.
          </p>
          <div className="perspective-grid">
            <div className="panel">
              <span className="badge badge-blue">계승·완성의 관점</span>
              <p style={{ marginTop: 10 }}>Neyman의 제자 Lehmann은 Fisher가 새로운 틀을 열었지만 검정통계량을 고르는 기준은 남겨 두었고, Neyman–Pearson이 두 오류와 최적성 이론으로 그 문제를 풀었다고 평가했습니다. 두 접근을 서로 보완하는 것으로 본 셈입니다.</p>
            </div>
            <div className="panel">
              <span className="badge badge-orange">대립의 관점</span>
              <p style={{ marginTop: 10 }}>베이즈 통계학자 Savage는 이 논쟁을 빈도론 내부의 가장 큰 분열로 보았습니다. 자료를 "근거"로 해석하는 일과 "행동"을 고르는 일은 다른 문제라는 비판은 오늘날까지 이어지고 있습니다.</p>
            </div>
          </div>
          <p className="field-hint" style={{ marginTop: 12 }}>
            요약 출처: 조재근(2013) 2.2절. 인용문은 원문을 옮기지 않고 내용만 요약했습니다.
          </p>
        </div>
      </section>

      {/* 05 혼합 절차 */}
      <section className="section alt" style={{ padding: '72px 0' }}>
        <div className="container">
          <p className="eyebrow">05 — 혼합 절차의 탄생</p>
          <h2 className="section-title">
            아무도 제안하지 않은 <span className="grad-text">교과서 절차</span>
          </h2>
          <p className="desc" style={{ maxWidth: 780, marginBottom: 32 }}>
            1940년 무렵부터 응용 분야, 특히 심리학의 교과서들은 두 접근에서 재료를 하나씩 가져와 섞었습니다. 그 결과가 오늘 우리가 배우는 귀무가설 유의성 검정(NHST)입니다. 교재 7.5절도 "현재 대부분의 교과서에서 혼용"한다고 설명합니다.
          </p>
          <div className="hybrid-flow" aria-label="Fisher와 Neyman–Pearson의 재료가 섞여 혼합 절차가 되는 그림">
            <div className="hybrid-box fisher">
              <h3>Fisher에게서</h3>
              <ul>
                {HYBRID.fisher.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="hybrid-plus" aria-hidden>
              +
            </div>
            <div className="hybrid-box np">
              <h3>Neyman–Pearson에게서</h3>
              <ul>
                {HYBRID.np.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="hybrid-plus" aria-hidden>
              →
            </div>
            <div className="hybrid-box hybrid">
              <h3>혼합 절차 (NHST)</h3>
              <ol>
                {HYBRID.hybrid.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="note" style={{ marginTop: 24, maxWidth: 780 }}>
            문제는 섞는 과정에서 두 철학의 전제가 사라졌다는 점입니다. p-값을 고정된 α와 비교해 "유의/비유의"로만 보고하면 Fisher가 말한 근거의 강도가 사라집니다. 대립가설과 검정력을 계획하지 않으면 NP가 보장한 오류 통제도 반쪽이 됩니다.
          </div>
        </div>
      </section>

      {/* 06 ASA */}
      <section className="section" style={{ padding: '72px 0' }}>
        <div className="container narrow">
          <p className="eyebrow">06 — 오늘의 반성</p>
          <h2 className="section-title">ASA의 p-값 성명 (2016)</h2>
          <p className="desc" style={{ marginBottom: 24 }}>
            미국통계학회는 p-값의 오용이 널리 퍼지자 이례적으로 공식 성명을 냈습니다. 여섯 원칙을 요약하면 다음과 같습니다.
          </p>
          <ol className="asa-list">
            {ASA_PRINCIPLES.map((t, i) => (
              <li key={i}>
                <span className="asa-num">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <p className="field-hint">출처: Wasserstein & Lazar (2016), The American Statistician 70(2). 한국어 문구는 원문과 대조해 확정해야 합니다.</p>
          <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 28 }}>
            <Link className="btn-filled" to="/learn/12">
              안내 학습 12단계에서 정리하기
            </Link>
            <Link className="btn-outline" to="/lab/pdist?model=coin">
              p-값의 분포 실험
            </Link>
          </div>
        </div>
      </section>

      {/* 참고 문헌 */}
      <section className="section alt" style={{ padding: '56px 0' }}>
        <div className="container narrow">
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 12px' }}>참고 문헌</h2>
          <ul className="ref-list">
            <li>이긍희 외 (2019). 『통계학의 개념 및 제문제』 1.7절, 7.5절. 한국방송통신대학교출판문화원.</li>
            <li>조재근 (2013). 20세기 전반기 통계학사에 대한 연구: 통계적 검정과 심리학을 중심으로. Journal for History of Mathematics, 26(4), 277–299.</li>
            <li>Neyman, J. & Pearson, E. S. (1933). On the problem of the most efficient tests of statistical hypotheses. Phil. Trans. R. Soc. A, 231, 289–337.</li>
            <li>Fisher, R. A. (1925). Statistical Methods for Research Workers. / (1935). The Design of Experiments.</li>
            <li>Wasserstein, R. L. & Lazar, N. A. (2016). The ASA statement on p-values. The American Statistician, 70(2), 129–133.</li>
            <li>위키백과: Statistical hypothesis testing, p-value, Likelihood-ratio test (2026-10-11 열람)</li>
          </ul>
        </div>
      </section>
    </>
  )
}
