// E2E에서 점검할 모든 페이지·모형
export const PAGES = ['#/', '#/learn', ...Array.from({ length: 12 }, (_, i) => `#/learn/${i + 1}`), '#/textbook', '#/math', '#/history', '#/glossary']

export const LABS = [
  'pvalue?model=coin',
  'pvalue?model=normal',
  'pvalue?model=tea',
  'errors?model=normal',
  'errors?model=coin',
  'errors?model=table',
  'power?model=normal',
  'power?model=coin',
  'pdist?model=coin',
  'pdist?model=normal',
  'np?model=table',
  'np?model=coin',
  'np?model=normal',
  'lrt?model=coin',
  'lrt?model=normal',
  'chisq?model=gof',
  'chisq?model=indep',
  'ci?model=coin',
  'ci?model=normal',
  'ttest?model=t1',
  'ttest?model=t2',
  'more?model=pois',
  'more?model=nvar',
  'pitfalls?model=seq',
  'pitfalls?model=multi',
].map((m) => `#/lab/${m}`)

export const ALL = [...PAGES, ...LABS]
