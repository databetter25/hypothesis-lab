import { describe, expect, it } from 'vitest'
import { GLOSSARY, GLOSSARY_BY_ID, GLOSSARY_CATS } from '../src/content/glossary'
import { MODULES } from '../src/state/labState'
import { STEPS } from '../src/content/learn'
import { PRESETS, presetHref } from '../src/content/presets'
import { TIMELINE } from '../src/content/history'

const MATH_IDS = ['likelihood', 'test-function', 'pvalue-rule', 'superuniform', 'np-lemma', 'mlr', 'no-ump', 'lrt', 'wilks']

/** 사이트 안 링크가 실제 경로를 가리키는지 */
function validLink(to: string): boolean {
  const [path, hash] = to.split('#')
  const [p] = path.split('?')
  if (p === '/history' || p === '/textbook' || p === '/learn' || p === '/glossary') return true
  if (p === '/math') return !hash || MATH_IDS.includes(hash)
  const learn = /^\/learn\/(\d+)$/.exec(p)
  if (learn) return STEPS.some((s) => s.n === Number(learn[1]))
  const lab = /^\/lab\/(\w+)$/.exec(p)
  if (lab) return MODULES.some((m) => m.id === lab[1])
  return false
}

describe('용어사전 데이터', () => {
  it('ID가 겹치지 않고 분류가 유효', () => {
    expect(new Set(GLOSSARY.map((g) => g.id)).size).toBe(GLOSSARY.length)
    for (const g of GLOSSARY) expect(GLOSSARY_CATS.map((c) => c.id)).toContain(g.cat)
  })
  it('관련 용어가 모두 존재', () => {
    for (const g of GLOSSARY) for (const r of g.related ?? []) expect(GLOSSARY_BY_ID[r], `${g.id} → ${r}`).toBeDefined()
  })
  it('PRD F13 필수 항목 포함', () => {
    const must = ['귀무가설', '대립가설', '검정통계량', '기각역', '채택역', '임계값', '제1종 오류', '제2종 오류', '유의수준', '크기', '수준 α 검정', 'p-값', '검정력', '검사특성곡선', '검정함수', '확률화 검정', '가능도', '가능도비', '최강력검정', '네이만–피어슨 보조정리', '단조가능도비', '균일최강력검정', '가능도비검정', 'Wilks', '유의성 검정', '가설검정', 'NHST', '몬테카를로 오차']
    const all = GLOSSARY.map((g) => g.ko).join(' | ')
    for (const m of must) expect(all, m).toContain(m)
  })
})

describe('사이트 내부 링크', () => {
  it('용어사전·연표·프리셋 링크가 실제 경로를 가리킴', () => {
    for (const g of GLOSSARY) for (const l of g.links ?? []) expect(validLink(l.to), `${g.id}: ${l.to}`).toBe(true)
    for (const t of TIMELINE) if (t.link) expect(validLink(t.link.to), t.link.to).toBe(true)
    for (const p of PRESETS) expect(validLink(presetHref(p)), p.id).toBe(true)
  })
})

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

describe('소스 위생', () => {
  it('수식 문자열에 탭·폼피드 같은 제어문자가 섞이지 않았다', () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
    const bad = walk('src')
      .filter((f) => /\.(ts|tsx)$/.test(f))
      // CRLF 줄바꿈은 허용하고, 줄바꿈이 아닌 \r(예: "\right"가 깨진 것)만 잡는다
      .filter((f) => /[\t\f\v\b]|\r(?!\n)/.test(readFileSync(f, 'utf-8')))
    expect(bad).toEqual([])
  })
})
