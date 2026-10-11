import { describe, expect, it } from 'vitest'
import { buildCsv } from '../src/lib/exportCsv'
import { simulate } from '../src/engine/simulate'

describe('CSV 내보내기 (PRD F19)', () => {
  it('설정·시드·결과·원자료를 담고, 따옴표를 이스케이프한다', () => {
    const r = simulate({ model: 'coin', n: 5, theta: 0.5, B: 100, seed: 7, phi: [0, 0, 0, 0, 1, 1] })
    const csv = buildCsv({ results: [{ label: 'sim', result: r }] }, new Date('2026-10-12T00:00:00Z'), 'http://x/#/lab/pvalue?model=coin&n=5&seed=7')
    expect(csv.startsWith('﻿항목,값')).toBe(true)
    expect(csv).toContain('설정:model,coin')
    expect(csv).toContain('sim:시드,7')
    expect(csv).toContain('sim:난수,xoshiro128ss-v1')
    expect(csv).toContain(`sim:기각 수,${r.rejects}`)
    expect(csv).toContain('sim:값,빈도')
    const lines = csv.split('\r\n')
    expect(lines.filter((l) => /^\d+,\d+$/.test(l)).length).toBe(6)
    const q = buildCsv({ results: [] }, new Date(0), 'http://x/#/lab/chisq?obs=1,2/3,4')
    expect(q).toContain('설정:obs,"1,2/3,4"')
  })
})
