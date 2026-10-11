import { useEffect, useState } from 'react'
import { TABLE_MAX_K } from '../engine/table'
import type { LabState } from '../state/labState'
import type { Update } from './common'

export const TABLE_PRESETS: { id: string; label: string; f0: string[]; f1: string[]; a: number; source: string }[] = [
  { id: 'T05', label: '교재 표 7.3', f0: ['.10', '.20', '.25', '.10', '.35'], f1: ['.25', '.15', '.20', '.10', '.30'], a: 0.15, source: '교재 7.6 · p.284' },
  { id: 'T06', label: '워크북 연습 3~5', f0: ['.4', '.3', '.2', '.1'], f1: ['.2', '.2', '.3', '.3'], a: 0.1, source: '워크북 p.129' },
  { id: 'T07', label: '2018 기말 22~23', f0: ['9/27', '12/27', '5/27', '1/27'], f1: ['2/27', '6/27', '12/27', '7/27'], a: 0.05, source: '워크북 p.169' },
]

/** f₀, f₁ 입력표. 분수 입력 허용. 입력 중에는 로컬 상태, 확정 시 URL 반영 */
export function TableEditor({ s, update, error }: { s: LabState; update: Update; error: string | null }) {
  const [f0, setF0] = useState(s.f0)
  const [f1, setF1] = useState(s.f1)
  useEffect(() => {
    setF0(s.f0)
    setF1(s.f1)
  }, [s.f0, s.f1])
  const commit = (a = f0, b = f1) => update({ f0: a, f1: b, R: '' })
  const K = f0.length

  return (
    <div className="panel">
      <h3>확률표 f₀, f₁</h3>
      <div className="row" style={{ marginBottom: 10 }}>
        {TABLE_PRESETS.map((p) => (
          <button key={p.id} className="btn-outline sm" onClick={() => update({ f0: p.f0, f1: p.f1, a: p.a, R: '' })} title={p.source}>
            {p.label}
          </button>
        ))}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>x</th>
            <th>f₀(x)</th>
            <th>f₁(x)</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: K }, (_, i) => (
            <tr key={i}>
              <td>{i}</td>
              <td>
                <input
                  className={`num-input${error?.startsWith('f₀') ? ' input-error' : ''}`}
                  style={{ minHeight: 32, padding: '4px 8px', textAlign: 'right' }}
                  value={f0[i]}
                  aria-label={`f₀(${i})`}
                  onChange={(e) => setF0(f0.map((v, j) => (j === i ? e.target.value : v)))}
                  onBlur={() => commit()}
                  onKeyDown={(e) => e.key === 'Enter' && commit()}
                />
              </td>
              <td>
                <input
                  className={`num-input${error?.startsWith('f₁') ? ' input-error' : ''}`}
                  style={{ minHeight: 32, padding: '4px 8px', textAlign: 'right' }}
                  value={f1[i]}
                  aria-label={`f₁(${i})`}
                  onChange={(e) => setF1(f1.map((v, j) => (j === i ? e.target.value : v)))}
                  onBlur={() => commit()}
                  onKeyDown={(e) => e.key === 'Enter' && commit()}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn-ghost" disabled={K >= TABLE_MAX_K} onClick={() => commit([...f0, '0'], [...f1, '0'])}>
          ＋ 값 추가
        </button>
        <button className="btn-ghost" disabled={K <= 2} onClick={() => commit(f0.slice(0, -1), f1.slice(0, -1))}>
          － 마지막 값 삭제
        </button>
      </div>
      <p className="field-hint">소수(0.25)나 분수(9/27)로 입력합니다. 각 열의 합은 정확히 1이어야 합니다.</p>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
