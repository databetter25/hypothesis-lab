import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { CHAPTERS, STEPS, stepHref } from '../content/learn'
import { progress, useProgress } from '../lib/progress'
import { Fold, TextbookBadge } from '../components/ui'
import { CheckpointBox, ExperimentTabs, ExplainBox, PredictBox } from '../learn/components'
import { ComparisonTable, EvidenceVsRule, Timeline } from '../history/components'

/* ---------- 목차 ---------- */

export function LearnIndexPage() {
  const p = useProgress()
  const done = STEPS.filter((s) => p.completed[String(s.n)]).length
  const nextStep = STEPS.find((s) => !p.completed[String(s.n)]) ?? STEPS[0]
  return (
    <>
      <section className="section" style={{ paddingBottom: 48 }}>
        <div className="container">
          <p className="eyebrow">안내 학습</p>
          <h1 className="section-title">
            3장 12단계로 걷는 <span className="grad-text">가설검정</span>
          </h1>
          <p className="desc" style={{ maxWidth: 720 }}>
            교재 제7장의 절 순서를 따릅니다. 단계마다 <strong>예상하기 → 실험하기 → 설명하기 → 수식 확인하기</strong>를 거치고 체크포인트로 마무리합니다. 단계 하나는 3~5분 분량입니다.
          </p>
          <div style={{ maxWidth: 520, marginTop: 28 }}>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: 6 }}>
              <span>진행</span>
              <span>
                {done} / {STEPS.length} 단계 완료
              </span>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${(done / STEPS.length) * 100}%` }} />
            </div>
          </div>
          <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 28 }}>
            <Link className="btn-filled" to={stepHref(nextStep.n)}>
              {done === 0 ? '1단계부터 시작' : done === STEPS.length ? '처음부터 다시 보기' : `${nextStep.n}단계로 이어서`}
            </Link>
            {done > 0 && (
              <button
                className="btn-outline"
                onClick={() => {
                  if (window.confirm('이 기기에 저장된 진행 상태, 예상, 체크포인트 응답을 모두 지울까요?')) progress.reset()
                }}
              >
                내 기록 지우기
              </button>
            )}
          </div>
          <p className="field-hint" style={{ marginTop: 12 }}>
            진행 상태와 입력은 이 기기의 브라우저에만 저장되며 서버로 보내지 않습니다.
          </p>
        </div>
      </section>
      {CHAPTERS.map((ch, i) => (
        <section key={ch.id} className={`section${i % 2 === 0 ? ' alt' : ''}`} style={{ padding: '56px 0' }}>
          <div className="container">
            <p className="eyebrow">
              {ch.id}장 · {ch.textbook} · 약 {ch.minutes}분
            </p>
            <h2 style={{ fontSize: '1.6rem', letterSpacing: '-0.6px', margin: '0 0 8px' }}>{ch.title}</h2>
            <p className="desc" style={{ marginBottom: 24, fontSize: '0.92rem' }}>
              {ch.desc}
            </p>
            <div className="list-box">
              {STEPS.filter((s) => s.chapter === ch.id).map((s) => (
                <Link key={s.n} to={stepHref(s.n)} className="list-row">
                  <span className="list-id">{p.completed[String(s.n)] ? '✓' : s.n}</span>
                  <span>
                    <h3>
                      {s.n}. {s.title}
                    </h3>
                    <p>{s.question}</p>
                  </span>
                  <span className="badge badge-gray">{s.textbook.split('·')[0].trim()}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  )
}

/* ---------- 단계 ---------- */

export function LearnStepPage() {
  const { step: param } = useParams()
  const n = Number(param)
  const step = STEPS.find((s) => s.n === n)
  const nav = useNavigate()
  const p = useProgress()
  if (!step) return <Navigate to="/learn" replace />
  const ch = CHAPTERS.find((c) => c.id === step.chapter)!
  const prev = STEPS.find((s) => s.n === n - 1)
  const next = STEPS.find((s) => s.n === n + 1)
  const done = p.completed[String(n)]

  return (
    <div className="container wide learn">
      <nav className="learn-steps" aria-label="단계 이동">
        {STEPS.map((s) => (
          <Link
            key={s.n}
            to={stepHref(s.n)}
            className={`learn-dot${s.n === n ? ' current' : ''}${p.completed[String(s.n)] ? ' done' : ''}`}
            aria-current={s.n === n ? 'step' : undefined}
            title={`${s.n}. ${s.title}`}
          >
            {s.n}
          </Link>
        ))}
      </nav>

      <header className="learn-head">
        <p className="eyebrow">
          {ch.id}장 {ch.title} · {n} / {STEPS.length}단계
        </p>
        <h1>{step.title}</h1>
        <p className="learn-question">{step.question}</p>
        <div className="row">
          <TextbookBadge>{step.textbook}</TextbookBadge>
          <span className="badge badge-yellow">흔한 오해: {step.misconception}</span>
        </div>
      </header>

      <div className="learn-narrow">
        <PredictBox step={step} />
      </div>

      <section className="learn-section">
        {step.special === 'evidence-vs-rule' ? (
          <div className="learn-narrow">
            <EvidenceVsRule />
          </div>
        ) : (
          <>
            <div className="learn-narrow">
              <p className="learn-label">② 실험하기</p>
              <ul className="observe-list">
                {step.observe.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
            <ExperimentTabs step={step} />
          </>
        )}
        {step.special === 'evidence-vs-rule' && (
          <div className="learn-narrow">
            <ul className="observe-list">
              {step.observe.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="learn-narrow">
        <ExplainBox step={step} />
        {step.math && (
          <div className="learn-card">
            <p className="learn-label">④ 수식 확인하기</p>
            <Fold title="수식 펼치기">{step.math}</Fold>
          </div>
        )}
        {step.special === 'evidence-vs-rule' && (
          <>
            <div className="learn-card">
              <p className="learn-label">④ 두 관점 비교</p>
              <ComparisonTable />
            </div>
            <div className="learn-card">
              <p className="learn-label">연표</p>
              <Timeline />
            </div>
          </>
        )}
        <div className="learn-card">
          <p className="learn-label">체크포인트</p>
          {step.checkpoints.map((cp) => (
            <CheckpointBox key={cp.id} cp={cp} />
          ))}
        </div>

        <div className="learn-footer">
          {prev ? (
            <Link className="btn-outline" to={stepHref(prev.n)}>
              ← {prev.n}. {prev.title}
            </Link>
          ) : (
            <Link className="btn-outline" to="/learn">
              ← 목차
            </Link>
          )}
          <button
            className="btn-filled"
            onClick={() => {
              progress.complete(String(n))
              nav(next ? stepHref(next.n) : '/learn')
            }}
          >
            {done ? '✓ 완료함 · ' : '이 단계 완료 · '}
            {next ? `${next.n}. ${next.title} →` : '목차로'}
          </button>
        </div>
      </div>
    </div>
  )
}
