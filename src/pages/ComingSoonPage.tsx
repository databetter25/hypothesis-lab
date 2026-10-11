import { Link } from 'react-router-dom'

export function ComingSoonPage({ title, desc }: { title: string; desc: string }) {
  return (
    <section className="section">
      <div className="container narrow" style={{ textAlign: 'center' }}>
        <p className="eyebrow">준비 중</p>
        <h1 className="section-title">{title}</h1>
        <p className="desc">{desc}</p>
        <div className="btn-row" style={{ marginTop: 32 }}>
          <Link className="btn-filled" to="/lab/pvalue">
            자유 실험 열기
          </Link>
          <Link className="btn-outline" to="/textbook">
            교재 예제 보기
          </Link>
        </div>
      </div>
    </section>
  )
}
