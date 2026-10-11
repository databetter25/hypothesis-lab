// 접근성 점검 (WCAG 2.2 AA, axe-core): 개발 서버(npm run dev)를 연 브라우저 콘솔에 붙여 넣고 실행한다.
// 결과는 window.__axeAgg에 규칙별로 모인다. 위반이 없으면 {}.
;(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  if (!window.axe) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = '/node_modules/axe-core/axe.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s) })
  const routes = ['#/', '#/learn', ...Array.from({ length: 12 }, (_, i) => `#/learn/${i + 1}`), '#/textbook', '#/math', '#/history', '#/glossary',
    ...['pvalue?model=coin', 'pvalue?model=normal', 'pvalue?model=tea', 'errors?model=normal', 'errors?model=coin', 'errors?model=table', 'power?model=normal', 'power?model=coin', 'pdist?model=coin', 'pdist?model=normal', 'np?model=table', 'np?model=coin', 'np?model=normal', 'lrt?model=coin', 'lrt?model=normal', 'chisq?model=gof', 'chisq?model=indep', 'ci?model=coin', 'ci?model=normal', 'ttest?model=t1', 'ttest?model=t2', 'more?model=pois', 'more?model=nvar', 'pitfalls?model=seq', 'pitfalls?model=multi'].map((m) => `#/lab/${m}`)]
  window.__axeAgg = {}
  for (const r of routes) {
    location.hash = r
    await wait(800)
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })
    for (const v of res.violations) (window.__axeAgg[v.id] ??= []).push({ route: r, nodes: v.nodes.map((n) => n.target.join(' ')) })
  }
  console.log('axe 점검 완료', routes.length, '쪽', window.__axeAgg)
})()
