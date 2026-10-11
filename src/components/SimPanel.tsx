import type { ReactNode } from 'react'
import { B_CHOICES } from '../state/labState'
import { fmtInt, fmtP } from '../lib/format'
import { wilson } from '../engine/core/stats'
import { RNG_ID } from '../engine/core/rng'
import type { SimResult } from '../engine/simulate'
import { downloadCsv } from '../lib/exportCsv'

interface Props {
  B: number
  onB: (b: number) => void
  seed: number | null
  status: 'idle' | 'running' | 'done'
  progress: number
  onRun: () => void
  onStop: () => void
  onReset: () => void
  label?: string
  children?: ReactNode
  /** CSV로 내보낼 결과 (두 조건이면 여러 개) */
  results?: { label: string; result: SimResult | null }[]
}

/** 반복 실험 실행 패널: B 선택, 실행·정지, 진행률, 시드 표시 */
export function SimPanel({ B, onB, seed, status, progress, onRun, onStop, onReset, label = '반복 실험', children, results }: Props) {
  const ready = (results ?? []).filter((r): r is { label: string; result: SimResult } => !!r.result)
  const exportCsv = () => {
    const page = (window.location.hash.split('?')[0] || '').replace(/[#/]+/g, '_').replace(/^_|_$/g, '')
    downloadCsv({ results: ready }, `hypothesis-lab_${page || 'result'}_${seed ?? 'noseed'}.csv`)
  }
  return (
    <div className="panel">
      <h3>{label}</h3>
      <div className="field">
        <span className="field-label">반복 횟수 B</span>
        <div className="tab-nav" role="radiogroup" aria-label="반복 횟수 B">
          {B_CHOICES.map((b) => (
            <button key={b} type="button" role="radio" aria-checked={B === b} className={`tab-btn${B === b ? ' active' : ''}`} onClick={() => onB(b)}>
              {fmtInt(b)}
            </button>
          ))}
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        {status === 'running' ? (
          <button className="btn-filled sm danger" onClick={onStop}>
            ■ 정지
          </button>
        ) : (
          <button className="btn-filled sm" onClick={onRun}>
            ▶ 실행
          </button>
        )}
        <button className="btn-outline sm" onClick={onReset} disabled={status === 'running'}>
          초기화
        </button>
        {ready.length > 0 && status !== 'running' && (
          <button className="btn-ghost" onClick={exportCsv} title="설정·시드·결과·원자료를 CSV로 저장합니다">
            ⬇ CSV
          </button>
        )}
      </div>
      {status === 'running' && (
        <div className="prog-track" style={{ marginTop: 12 }} role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="prog-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {children}
      <p className="field-hint" style={{ marginTop: 10, marginBottom: 0 }}>
        시드 {seed ?? '— (실행 시 생성)'} · 난수 {RNG_ID}
      </p>
    </div>
  )
}

/** 추정 비율 + 95% Wilson 구간 + 정확값 */
export function SimRate({
  label,
  k,
  B,
  exact,
  refLabel = '정확값',
  outsideMsg = '— 구간 밖 (B를 늘려 보세요)',
}: {
  label: string
  k: number
  B: number
  exact?: number
  refLabel?: string
  outsideMsg?: string
}) {
  const [lo, hi] = wilson(k, B)
  const inside = exact === undefined ? null : lo <= exact && exact <= hi
  return (
    <div style={{ fontSize: '0.82rem', marginTop: 8 }}>
      <div>
        <strong>{label}</strong>: {fmtInt(k)} / {fmtInt(B)} = <strong>{fmtP(k / B)}</strong>
      </div>
      <div className="field-hint">
        95% 구간 [{fmtP(lo)}, {fmtP(hi)}]
        {exact !== undefined && (
          <>
            {' '}
            · {refLabel} {fmtP(exact)} {inside ? '✓ 구간 안' : outsideMsg}
          </>
        )}
      </div>
    </div>
  )
}
