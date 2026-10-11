import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { ALL } from './routes'

// PRD A10: 모든 페이지·모형에서 WCAG 2.2 AA 위반 0건, 콘솔 오류 0건, 가로 넘침 없음
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function settle(page: import('@playwright/test').Page, route: string) {
  await page.goto(`./${route}`)
  await page.locator('main h1, main h2').first().waitFor()
  // 진입 애니메이션(히어로는 최대 1.7초)이 모두 끝난 뒤 대비를 잰다
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))))
  await page.waitForTimeout(300)
}

for (const route of ALL) {
  test(`접근성·오류 없음 ${route}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    await settle(page, route)
    const res = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    expect(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([])
    expect(errors).toEqual([])
  })
}

const MOBILE = ['#/', '#/learn/1', '#/learn/8', '#/learn/12', '#/lab/pvalue?model=coin', '#/lab/np?model=table', '#/lab/chisq?model=indep', '#/lab/ci?model=coin', '#/lab/ttest?model=t2', '#/lab/pitfalls?model=seq', '#/math', '#/history', '#/glossary']

for (const route of MOBILE) {
  test(`모바일: 가로 넘침 없음·접근성 ${route} @mobile`, async ({ page }) => {
    await settle(page, route)
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width)
    const res = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    expect(res.violations.map((v) => v.id)).toEqual([])
  })
}
