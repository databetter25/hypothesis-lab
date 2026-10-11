// 결과 CSV 내려받기 (PRD F19). 설정은 URL 쿼리(단일 진실원)에서, 결과는 시뮬레이션에서 가져온다.
// 학생의 서술 응답은 넣지 않는다.
import type { SimResult } from '../engine/simulate'
import { wilson } from '../engine/core/stats'

const esc = (v: unknown) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export interface ExportInput {
  results: { label: string; result: SimResult }[]
}

export function buildCsv({ results }: ExportInput, now = new Date(), href = window.location.href): string {
  const rows: (string | number)[][] = []
  const hash = href.includes('#') ? href.slice(href.indexOf('#') + 1) : ''
  const [path, query = ''] = hash.split('?')
  rows.push(['항목', '값'])
  rows.push(['도구', '검정 실험실'])
  rows.push(['내보낸 시각', now.toISOString()])
  rows.push(['화면', path])
  rows.push(['재현 링크', href])
  for (const [k, v] of new URLSearchParams(query)) rows.push([`설정:${k}`, v])
  for (const { label, result: r } of results) {
    const [lo, hi] = wilson(r.rejects, r.B)
    rows.push([`${label}:난수`, r.meta.rngId])
    rows.push([`${label}:시드`, r.meta.seed])
    rows.push([`${label}:반복 B`, r.B])
    rows.push([`${label}:기각 수`, r.rejects])
    rows.push([`${label}:기각 비율`, r.rejects / r.B])
    rows.push([`${label}:95% Wilson 하한`, lo])
    rows.push([`${label}:95% Wilson 상한`, hi])
    if (r.rejects2 !== undefined) rows.push([`${label}:두 번째 규칙 기각 수`, r.rejects2])
    if (r.extra) for (const [k, v] of Object.entries(r.extra)) rows.push([`${label}:${k}`, v])
  }
  // 원자료: 이산 통계량의 빈도 또는 반복별 통계량 값
  for (const { label, result: r } of results) {
    rows.push([])
    if (r.counts) {
      rows.push([`${label}:값`, '빈도'])
      r.counts.forEach((c, i) => rows.push([i, c]))
    } else if (r.values) {
      const head: string[] = [`${label}:반복`, '값']
      if (r.values2) head.push('값2')
      rows.push(head)
      for (let i = 0; i < r.values.length; i++) rows.push(r.values2 ? [i + 1, r.values[i], r.values2[i]] : [i + 1, r.values[i]])
    }
  }
  // 엑셀이 한글을 깨뜨리지 않도록 BOM을 붙인다
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')
}

export function downloadCsv(input: ExportInput, filename: string) {
  const blob = new Blob([buildCsv(input)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
