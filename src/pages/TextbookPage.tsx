import { Link } from 'react-router-dom'
import { PRESETS, presetHref, type Preset } from '../content/presets'

const GROUPS: { g: Preset['group']; title: string; desc: string }[] = [
  { g: 'T', title: '교재·워크북 재현', desc: '『통계학의 개념 및 제문제』 제7장의 예제, 연습문제, R 실습, 워크북 문항을 같은 수치로 재현합니다.' },
  { g: 'E', title: '동전 개념 예제', desc: '이산분포에서 생기는 미묘한 점(크기 ≠ α, 검정력 비단조, 두 가지 양측 p-값)을 보여 줍니다.' },
  { g: 'W', title: 'Wilks 근사 점검', desc: '−2 log Λ의 χ² 근사가 언제 믿을 만한지 확인합니다.' },
  { g: 'X', title: 'χ²검정 (교재 7.4)', desc: '다항분포의 가능도비검정에서 Pearson χ²검정을 얻고, 적합도와 독립성 검정을 해 봅니다.' },
  { g: 'Y', title: 't검정 (교재 예 7.7, 7.8)', desc: 'σ를 모를 때의 한 표본 t검정과 두 표본 t검정, 그리고 등분산 가정의 역할을 봅니다.' },
  { g: 'P', title: '오용 체험 (교재 범위 밖)', desc: '유의할 때까지 엿보기와 검정 여러 번 하기가 실제 크기를 얼마나 부풀리는지 정확히 계산합니다.' },
  { g: 'C', title: '신뢰구간과 검정 (교재 8.7)', desc: '신뢰구간은 기각하지 못하는 가설값의 모임입니다. 세 가지 비율 구간의 포함확률도 비교합니다.' },
]

export function TextbookPage() {
  return (
    <>
      <section className="section" style={{ paddingBottom: 40 }}>
        <div className="container">
          <p className="eyebrow">교재 예제</p>
          <h1 className="section-title">
            교재의 숫자를 <span className="grad-text">움직여 보기</span>
          </h1>
          <p className="desc">각 항목은 실험 화면을 해당 설정으로 엽니다. 오른쪽에 적힌 기준값은 SciPy로 계산해 교재 해설과 대조한 값입니다.</p>
        </div>
      </section>
      {GROUPS.map(({ g, title, desc }, i) => (
        <section key={g} className={`section${i % 2 === 0 ? ' alt' : ''}`} style={{ padding: '56px 0' }}>
          <div className="container">
            <h2 style={{ fontSize: '1.4rem', letterSpacing: '-0.5px', margin: '0 0 6px' }}>{title}</h2>
            <p className="desc" style={{ marginBottom: 20, fontSize: '0.9rem' }}>
              {desc}
            </p>
            <div className="list-box">
              {PRESETS.filter((p) => p.group === g).map((p) => (
                <Link key={p.id} to={presetHref(p)} className="list-row">
                  <span className="list-id">{p.id}</span>
                  <span>
                    <h3>{p.title}</h3>
                    <p>{p.source}</p>
                  </span>
                  <span className="badge badge-blue">{p.expect}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  )
}
