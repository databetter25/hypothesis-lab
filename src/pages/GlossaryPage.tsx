import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GLOSSARY, GLOSSARY_BY_ID, GLOSSARY_CATS, type GlossaryCat, type GlossaryEntry } from '../content/glossary'
import { TextbookBadge } from '../components/ui'

const norm = (s: string) => s.toLowerCase().replace(/[\s·\-–()]/g, '')

function matches(g: GlossaryEntry, q: string): boolean {
  if (!q) return true
  const k = norm(q)
  return [g.ko, g.en, g.symbol ?? '', g.easy, g.myth.wrong].some((t) => norm(t).includes(k))
}

export function GlossaryPage() {
  const [sp, setSp] = useSearchParams()
  const focus = sp.get('t')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<GlossaryCat | 'all'>('all')

  const list = useMemo(() => GLOSSARY.filter((g) => (cat === 'all' || g.cat === cat) && matches(g, q)), [q, cat])

  // ?t=용어 로 들어오면 그 항목으로 이동하고 강조
  useEffect(() => {
    if (!focus || !GLOSSARY_BY_ID[focus]) return
    setQ('')
    setCat('all')
    const t = setTimeout(() => document.getElementById(`g-${focus}`)?.scrollIntoView({ block: 'start' }), 50)
    return () => clearTimeout(t)
  }, [focus])

  const goto = (id: string) => setSp({ t: id }, { replace: false })

  return (
    <>
      <section className="section" style={{ paddingBottom: 32 }}>
        <div className="container">
          <p className="eyebrow">용어사전</p>
          <h1 className="section-title">
            가설검정 <span className="grad-text">용어 {GLOSSARY.length}개</span>
          </h1>
          <p className="desc" style={{ maxWidth: 760 }}>
            항목마다 쉬운 설명, 교재 정의와 위치, 영문 표기, 흔한 오해, 그리고 바로 해 볼 수 있는 실험을 묶었습니다. 본문에서 점선 밑줄이 있는 용어에 마우스를 올리면 쉬운 설명이 나타납니다.
          </p>
        </div>
      </section>

      <div className="container glossary-bar">
        <input className="text-input glossary-search" type="search" placeholder="용어 검색 (예: p-값, power, 크기)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="용어 검색" />
        <div className="row" role="group" aria-label="분류">
          <button className="btn-outline sm" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
            전체
          </button>
          {GLOSSARY_CATS.map((c) => (
            <button key={c.id} className="btn-outline sm" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container glossary-list">
        <p className="field-hint" aria-live="polite">
          {list.length}개 항목
        </p>
        {list.length === 0 && <p className="muted">찾는 용어가 없습니다. 다른 표현(영문, 기호)으로 검색해 보세요.</p>}
        {list.map((g) => (
          <article key={g.id} id={`g-${g.id}`} className={`glossary-card${focus === g.id ? ' focused' : ''}`}>
            <header className="glossary-head">
              <h2>
                {g.ko}
                {g.symbol && <span className="glossary-symbol">{g.symbol}</span>}
              </h2>
              <span className="glossary-en">{g.en}</span>
              <span className="badge badge-gray">{GLOSSARY_CATS.find((c) => c.id === g.cat)?.label}</span>
            </header>
            <p className="glossary-easy">{g.easy}</p>
            <div className="glossary-def">
              <div className="row" style={{ marginBottom: 6 }}>
                <span className="learn-label" style={{ margin: 0 }}>
                  정의
                </span>
                <TextbookBadge>{g.ref}</TextbookBadge>
              </div>
              <div>{g.def}</div>
            </div>
            <div className="glossary-myth">
              <div>
                <span className="myth-x" aria-hidden>
                  ✗
                </span>
                <span>
                  <span className="sr-only">흔한 오해: </span>
                  {g.myth.wrong}
                </span>
              </div>
              <div>
                <span className="myth-o" aria-hidden>
                  ✓
                </span>
                <span>
                  <span className="sr-only">바른 이해: </span>
                  {g.myth.right}
                </span>
              </div>
            </div>
            {(g.links?.length || g.related?.length) && (
              <footer className="glossary-foot">
                {g.links?.map((l) => (
                  <Link key={l.to} to={l.to} className="btn-ghost">
                    {l.label} →
                  </Link>
                ))}
                {g.related && g.related.length > 0 && (
                  <span className="glossary-related">
                    <span className="field-hint">관련 용어</span>
                    {g.related.map((r) =>
                      GLOSSARY_BY_ID[r] ? (
                        <button key={r} className="chip" onClick={() => goto(r)}>
                          {GLOSSARY_BY_ID[r].ko}
                        </button>
                      ) : null,
                    )}
                  </span>
                )}
              </footer>
            )}
          </article>
        ))}
      </div>
    </>
  )
}
