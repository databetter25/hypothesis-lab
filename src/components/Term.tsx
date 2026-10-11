import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GLOSSARY_BY_ID } from '../content/glossary'

/** 본문 용어: 마우스를 올리거나 포커스하면 쉬운 설명을 미리 보여 준다 (PRD F13) */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const g = GLOSSARY_BY_ID[id]
  const pid = useId()
  if (!g) return <>{children}</>
  return (
    <span className="term" tabIndex={0} aria-describedby={pid}>
      {children ?? g.ko}
      <span className="term-pop" role="tooltip" id={pid}>
        <strong>
          {g.ko}
          {g.symbol ? ` ${g.symbol}` : ''}
        </strong>{' '}
        <span className="term-en">{g.en}</span>
        <span className="term-easy">{g.easy}</span>
        <Link to={`/glossary?t=${g.id}`} className="term-link" tabIndex={-1}>
          용어사전에서 보기 →
        </Link>
      </span>
    </span>
  )
}
