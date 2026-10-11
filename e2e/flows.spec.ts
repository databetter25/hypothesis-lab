import { expect, test, type Page } from '@playwright/test'

const run = async (page: Page) => {
  await page.getByRole('button', { name: '▶ 실행' }).click()
  await expect(page.getByRole('button', { name: '▶ 실행' })).toBeVisible({ timeout: 30_000 })
}

test('E01: 동전 p-값과 실제 크기가 기준값과 같다', async ({ page }) => {
  await page.goto('./#/lab/pvalue?model=coin&n=20&t0=0.5&x=14&a=0.05&dir=R')
  await expect(page.locator('.stat-box').filter({ hasText: 'p-값' }).first()).toContainText('0.0577')
  await expect(page.locator('.stat-box').filter({ hasText: '실제 크기' })).toContainText('0.0207')
  await expect(page.locator('.verdict')).toHaveText('H₀를 기각하지 못함')
})

test('A04: α만 바꾸면 p-값은 그대로, 규칙만 바뀐다', async ({ page }) => {
  await page.goto('./#/lab/pvalue?model=coin&n=20&t0=0.5&x=14&a=0.05&dir=R')
  const p = page.locator('.stat-box').filter({ hasText: '자료의 성질' })
  await expect(p).toContainText('0.0577')
  await page.goto('./#/lab/pvalue?model=coin&n=20&t0=0.5&x=14&a=0.1&dir=R')
  await expect(p).toContainText('0.0577')
  await expect(page.locator('.verdict')).toHaveText('H₀ 기각')
})

test('A08: 같은 시드·설정의 링크는 같은 시뮬레이션 결과를 낸다', async ({ page }) => {
  const url = './#/lab/ttest?model=t1&n=10&x=0.3&sd=1&t0=0&ts=0&sig=1&a=0.05&dir=two&B=10000&seed=21'
  const read = async () => {
    await page.goto(url)
    await run(page)
    return page.locator('.col-settings').getByText(/z 임계값으로 기각: /).innerText()
  }
  const a = await read()
  const b = await read()
  expect(a).toBe(b)
  expect(a).toContain('880 / 10,000')
})

test('A09: 잘못된 링크는 기본값으로 복원하고 알린다', async ({ page }) => {
  await page.goto('./#/lab/pvalue?model=coin&n=abc&a=9&x=99')
  await expect(page.getByRole('status').filter({ hasText: '기본값으로 복원' })).toBeVisible()
  await expect(page.locator('.lab-head h1')).toHaveText('p-값과 기각역')
})

test('A10: 키보드만으로 기각역을 만든다 (교재·워크북 표)', async ({ page }) => {
  await page.goto('./#/lab/np?model=table&f0=.4,.3,.2,.1&f1=.2,.2,.3,.3&a=0.1&R=')
  const bar3 = page.getByRole('button', { name: /^3: 기각역에 없음/ })
  await bar3.focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: /^3: 기각역에 포함됨/ })).toBeVisible()
  await expect(page.locator('.verdict')).toContainText('최선')
})

test('교재 표 7.3: 확률화 최강력 검정함수', async ({ page }) => {
  await page.goto('./#/lab/np?model=table&f0=.10,.20,.25,.10,.35&f1=.25,.15,.20,.10,.30&a=0.15')
  await page.getByRole('button', { name: '보조정리 규칙 (확률화)' }).click()
  await expect(page.locator('.stat-box').first()).toContainText('3/20')
  await expect(page.locator('.stat-box').nth(1)).toContainText('3/10')
})

test('시뮬레이션이 정확값의 95% 구간에 든다 (χ² 작은 기대도수, 전수 계산)', async ({ page }) => {
  await page.goto('./#/lab/chisq?model=gof&a=0.05&p0=1/5,1/5,1/5,1/5,1/5&obs=1,5,3,2,4&B=10000&seed=11')
  await expect(page.locator('.note.blue')).toContainText('정확 p-값')
  await run(page)
  // X²·G 두 줄 모두 정확한 크기를 95% 구간 안에 포함해야 한다
  await expect(page.locator('.col-settings').getByText(/정확한 크기 .* ✓ 구간 안/)).toHaveCount(2)
})

test('안내 학습: 예상·해설·체크포인트·완료가 기기에 저장된다', async ({ page }) => {
  await page.goto('./#/learn/2')
  await page.getByRole('radio', { name: '약 6%' }).click()
  await page.getByRole('button', { name: '해설 보기' }).click()
  await expect(page.locator('.note.blue')).toContainText('0.0577')
  await page.getByRole('radio', { name: /틀리다 — H₀ 아래에서/ }).click()
  await expect(page.locator('.checkpoint').first().locator('.verdict')).toContainText('정답입니다')
  await page.getByRole('button', { name: /이 단계 완료/ }).click()
  await expect(page).toHaveURL(/#\/learn\/3$/)
  await page.goto('./#/learn')
  await expect(page.getByText('1 / 12 단계 완료')).toBeVisible()
  await page.reload()
  await expect(page.getByText('1 / 12 단계 완료')).toBeVisible()
})

test('용어사전: 검색과 바로가기 링크', async ({ page }) => {
  await page.goto('./#/glossary')
  await page.getByRole('searchbox', { name: '용어 검색' }).fill('power')
  await expect(page.locator('.glossary-card h2').first()).toContainText('검정력')
  await page.goto('./#/glossary?t=wilks')
  await expect(page.locator('.glossary-card.focused h2')).toContainText('Wilks')
})

test('F19: CSV에 설정·시드·결과가 담긴다', async ({ page }) => {
  await page.goto('./#/lab/errors?model=normal&n=1&t0=0&t1=3&sd=1&dir=R&rule=manual&c=2&B=1000&seed=12345')
  await run(page)
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '⬇ CSV' }).click()])
  expect(dl.suggestedFilename()).toBe('hypothesis-lab_lab_errors_12345.csv')
  const path = await dl.path()
  const text = (await import('node:fs')).readFileSync(path!, 'utf-8')
  expect(text).toContain('설정:seed,12345')
  expect(text).toContain('H0:난수,xoshiro128ss-v1')
  expect(text).toContain('H1:반복 B,1000')
})

test('F20: 한 번 연 뒤에는 오프라인에서도 동작한다', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // 서비스 워커가 미리 캐시를 마치고 페이지를 제어할 때까지
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await context.setOffline(true)
  await page.goto('./#/lab/ttest?model=t1&seed=3&B=1000')
  await expect(page.locator('.lab-head h1')).toHaveText('t검정')
  await run(page)
  await expect(page.locator('.col-settings').getByText(/t 임계값으로 기각: /)).toBeVisible()
  await page.goto('./#/math')
  await expect(page.locator('.math-section h2').first()).toHaveText('가능도와 충분통계량')
  await context.setOffline(false)
})
