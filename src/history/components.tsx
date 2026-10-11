import { useState } from 'react'
import { Link } from 'react-router-dom'
import { coinAutoRule, coinPmf, upperTail } from '../engine/coin'
import { expectPhi } from '../engine/discrete'
import { teaPmf } from '../engine/tea'
import { fmtP } from '../lib/format'
import { COMPARISON, ERAS, TIMELINE } from '../content/history'

type Case = 'coin' | 'tea'

/** 같은 자료를 Fisher식(근거)과 NP식(규칙 성능)으로 전환해 보기 (PRD F10) */
export function EvidenceVsRule({ cases = ['coin'], label = '② 같은 자료, 두 관점' }: { cases?: Case[]; label?: string }) {
  const [view, setView] = useState<'fisher' | 'np'>('fisher')
  const [c, setC] = useState<Case>(cases[0])

  const coin = (() => {
    const f0 = coinPmf(20, 0.5)
    const rule = coinAutoRule(20, 0.5, 0.05, 'R')
    const power07 = expectPhi(rule.phi, coinPmf(20, 0.7))
    return { p: upperTail(f0, 14), rule, power07 }
  })()
  const teaF = teaPmf().map((f) => f.toNumber())
  const tea = { p: upperTail(teaF, 4), p3: upperTail(teaF, 3) }
  const p = c === 'coin' ? coin.p : tea.p
  const pos = Math.min(1, Math.max(0, (-Math.log10(p) - 1) / 3))

  return (
    <div className="learn-card">
      <p className="learn-label">{label}</p>
      {cases.length > 1 && (
        <div className="row" style={{ marginBottom: 12 }}>
          {cases.map((k) => (
            <button key={k} className="btn-outline sm" aria-pressed={c === k} onClick={() => setC(k)}>
              {k === 'coin' ? '동전 20번 중 앞면 14회' : '홍차 4잔 모두 정답'}
            </button>
          ))}
        </div>
      )}
      <div className="tab-nav" role="tablist" style={{ marginBottom: 16 }}>
        <button role="tab" aria-selected={view === 'fisher'} className={`tab-btn${view === 'fisher' ? ' active' : ''}`} onClick={() => setView('fisher')}>
          근거 보기 (Fisher)
        </button>
        <button role="tab" aria-selected={view === 'np'} className={`tab-btn${view === 'np' ? ' active' : ''}`} onClick={() => setView('np')}>
          규칙 성능 보기 (Neyman–Pearson)
        </button>
      </div>

      {view === 'fisher' ? (
        <div>
          <p>
            <strong>귀무가설</strong>: {c === 'coin' ? '동전은 공정하다 (θ = 0.5).' : '감별 능력이 없다 (무작위로 고른다).'} 대립가설은 세우지 않습니다.
          </p>
          <p>
            <strong>p-값</strong> = {c === 'coin' ? 'P(X ≥ 14 | H₀)' : 'P(K ≥ 4 | H₀) = 1/70'} = <strong>{fmtP(p)}</strong>
          </p>
          <div className="evidence-scale" aria-label={`근거 척도에서 p = ${fmtP(p)}의 위치`}>
            <div className="evidence-track">
              <div className="evidence-marker" style={{ left: `${pos * 100}%` }} />
            </div>
            <div className="evidence-ticks">
              <span>0.1</span>
              <span>0.01</span>
              <span>0.001</span>
              <span>0.0001</span>
            </div>
            <div className="evidence-ticks muted">
              <span>약함</span>
              <span />
              <span />
              <span>강함</span>
            </div>
          </div>
          <p className="muted" style={{ color: 'var(--c-text-secondary)' }}>
            {c === 'coin'
              ? '해석: 공정성에 반하는 증거가 있으나 강하지 않다. 결론은 잠정적이며, 더 많은 자료나 다른 실험으로 이어 가야 한다.'
              : '해석: 감별 능력이 없다는 가설에 대한 꽤 강한 반대 증거다. 다만 이것으로 능력이 "증명"되지는 않으며, 실험을 되풀이해 확인해야 한다.'}{' '}
            p-값을 고정된 기준과 비교해 기계적으로 판정하지 않는다.
          </p>
        </div>
      ) : c === 'coin' ? (
        <div>
          <p>
            <strong>자료를 보기 전에</strong> 정한 것: H₀: θ = 0.5 대 H₁: θ &gt; 0.5, α = 0.05.
          </p>
          <table className="data-table" style={{ marginBottom: 12 }}>
            <tbody>
              <tr>
                <td>기각역 R</td>
                <td>x ≥ {coin.rule.c}</td>
              </tr>
              <tr>
                <td>제1종 오류 확률 (실제 크기)</td>
                <td>{fmtP(coin.rule.size)}</td>
              </tr>
              <tr>
                <td>θ = 0.7에서 검정력</td>
                <td>{fmtP(coin.power07)}</td>
              </tr>
              <tr>
                <td>θ = 0.7에서 제2종 오류 확률</td>
                <td>{fmtP(1 - coin.power07)}</td>
              </tr>
              <tr>
                <td>관측 x = 14의 판정</td>
                <td>R 밖 → H₀ 쪽 행동을 택함</td>
              </tr>
            </tbody>
          </table>
          <p className="muted" style={{ color: 'var(--c-text-secondary)' }}>
            해석: 이 규칙을 반복해 쓰면 공정한 동전을 잘못 의심하는 비율은 {fmtP(coin.rule.size)} 이하다. 하지만 θ = 0.7인 동전도 {fmtP(1 - coin.power07)}의 비율로 놓친다. "채택"은 H₀를 믿는다는 뜻이 아니라 그렇게 행동한다는 뜻이다.
          </p>
        </div>
      ) : (
        <div>
          <p>
            <strong>자료를 보기 전에</strong> 정한 것: H₀: 무작위 추측 대 H₁: 감별 능력 있음, α = 0.05.
          </p>
          <table className="data-table" style={{ marginBottom: 12 }}>
            <tbody>
              <tr>
                <td>기각역 R</td>
                <td>K = 4 (네 잔 모두 정답)</td>
              </tr>
              <tr>
                <td>제1종 오류 확률 (실제 크기)</td>
                <td>1/70 ≈ {fmtP(tea.p)}</td>
              </tr>
              <tr>
                <td>한 칸 넓힌 K ≥ 3의 크기</td>
                <td>17/70 ≈ {fmtP(tea.p3)} &gt; α</td>
              </tr>
              <tr>
                <td>검정력</td>
                <td>H₁ 아래의 확률모형이 있어야 계산 가능</td>
              </tr>
              <tr>
                <td>관측 K = 4의 판정</td>
                <td>R 안 → H₁ 쪽 행동을 택함</td>
              </tr>
            </tbody>
          </table>
          <p className="muted" style={{ color: 'var(--c-text-secondary)' }}>
            해석: NP식으로 보려면 "감별 능력이 있다"를 확률모형으로 구체화해야 검정력과 제2종 오류를 말할 수 있다. Fisher는 과학 실험에서 이런 대립가설을 세우는 것 자체를 받아들이지 않았다. 두 관점이 갈라지는 지점이다.
          </p>
        </div>
      )}
      <p className="field-hint">이 두 화면은 각 역사적 입장 전체를 재현한 것이 아니라, 핵심 차이를 같은 사례로 보여 주는 요약입니다.</p>
    </div>
  )
}

export function ComparisonTable() {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="표 (넘치면 가로·세로로 스크롤)" style={{ maxHeight: 'none' }}>
      <table className="data-table compare-table">
        <thead>
          <tr>
            <th>비교</th>
            <th>Fisher 유의성 검정</th>
            <th>Neyman–Pearson 가설검정</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map(([k, a, b]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{a}</td>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="field-hint">출처: 교재 7.5, 조재근(2013) 표 1, 위키백과 Statistical hypothesis testing</p>
    </div>
  )
}

/** 연표. grouped이면 시대별로 묶고, 출처 대조 상태와 관련 실험 링크를 보인다 */
export function Timeline({ grouped = false }: { grouped?: boolean }) {
  const item = (t: (typeof TIMELINE)[number]) => (
    <li key={t.year + t.who}>
      <span className="tl-year">{t.year}</span>
      <div>
        <strong>{t.who}</strong> — {t.what}
        <div className="tl-meta">
          <span className={`badge ${t.verified ? 'badge-green' : 'badge-yellow'}`}>{t.verified ? '출처 일치' : '원문 대조 필요'}</span>
          <span className="field-hint">
            {t.source}
            {t.note ? ` · ${t.note}` : ''}
          </span>
          {t.link && (
            <Link to={t.link.to} className="tl-link">
              {t.link.label} →
            </Link>
          )}
        </div>
      </div>
    </li>
  )
  if (!grouped) return <ol className="timeline">{TIMELINE.map(item)}</ol>
  return (
    <div className="timeline-grouped">
      {ERAS.map((e) => (
        <section key={e.id} className="tl-era">
          <h3>
            {e.title} <span className="field-hint">{e.span}</span>
          </h3>
          <ol className="timeline">{TIMELINE.filter((t) => t.era === e.id).map(item)}</ol>
        </section>
      ))}
    </div>
  )
}
