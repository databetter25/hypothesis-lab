import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ComingSoonPage } from './pages/ComingSoonPage'

// 홈을 뺀 페이지는 열 때 불러온다 (KaTeX·엔진·콘텐츠를 첫 화면에서 분리)
const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => lazy(() => load().then((m) => ({ default: m[name] })))
const LabPage = named(() => import('./pages/LabPage'), 'LabPage')
const TextbookPage = named(() => import('./pages/TextbookPage'), 'TextbookPage')
const LearnIndexPage = named(() => import('./pages/LearnPages'), 'LearnIndexPage')
const LearnStepPage = named(() => import('./pages/LearnPages'), 'LearnStepPage')
const HistoryPage = named(() => import('./pages/HistoryPage'), 'HistoryPage')
const MathPage = named(() => import('./pages/MathPage'), 'MathPage')
const GlossaryPage = named(() => import('./pages/GlossaryPage'), 'GlossaryPage')

function usePresentMode() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    document.body.classList.toggle('present', on)
  }, [on])
  return [on, setOn] as const
}

export default function App() {
  const [present, setPresent] = usePresentMode()
  const loc = useLocation()
  useEffect(() => {
    if (!loc.hash) window.scrollTo(0, 0)
  }, [loc.pathname, loc.hash])

  return (
    <>
      <a className="sr-only" href="#main">
        본문으로 건너뛰기
      </a>
      <header className="nav">
        <div className="nav-inner">
          <NavLink to="/" className="nav-brand">
            <img src="./favicon.svg" alt="" />
            검정 실험실
          </NavLink>
          <nav className="nav-links" aria-label="주 메뉴">
            <NavLink to="/learn">안내 학습</NavLink>
            <NavLink to="/lab/pvalue">자유 실험</NavLink>
            <NavLink to="/textbook">교재 예제</NavLink>
            <NavLink to="/math">수리적 원리</NavLink>
            <NavLink to="/history">검정의 역사</NavLink>
            <NavLink to="/glossary">용어사전</NavLink>
          </nav>
          <div className="nav-tools">
            <button className="btn-outline sm" aria-pressed={present} onClick={() => setPresent(!present)} title="글자를 키우고 설명 칸을 줄입니다">
              발표 모드
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <Suspense fallback={<div className="page-loading" role="status">불러오는 중…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="/lab/:module" element={<LabPage />} />
          <Route path="/textbook" element={<TextbookPage />} />
          <Route path="/learn" element={<LearnIndexPage />} />
          <Route path="/learn/:step" element={<LearnStepPage />} />
          <Route path="/math" element={<MathPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="*" element={<ComingSoonPage title="페이지를 찾을 수 없습니다" desc="주소를 확인해 주세요." />} />
        </Routes>
        </Suspense>
      </main>
      <footer className="footer">
        <div className="container">
          검정 실험실 · 『통계학의 개념 및 제문제』(한국방송통신대학교출판문화원, 2019) 제7장 연계 학습 도구 · 모든 계산은 브라우저에서 수행되며 어떤 데이터도 서버로 보내지 않습니다. 한 번 열어 두면 인터넷이 끊겨도 사용할 수 있습니다.
        </div>
      </footer>
    </>
  )
}
