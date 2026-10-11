import { createContext, useContext, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MODEL_LABEL, MODULES, ranges, type Dir, type LabState, type ModelId, type ModuleId } from '../state/labState'
import { Segmented, SliderField } from '../components/ui'
import { fmtAlpha } from '../lib/format'

export type Update = (patch: Partial<LabState>) => void

export function ModuleTabs({ current, model }: { current: ModuleId; model: ModelId }) {
  return (
    <nav className="tab-nav" aria-label="실험 모듈">
      {MODULES.map((m) => (
        <Link
          key={m.id}
          to={`/lab/${m.id}${m.models.includes(model) ? `?model=${model}` : ''}`}
          className={`tab-btn${current === m.id ? ' active' : ''}`}
          aria-current={current === m.id ? 'page' : undefined}
          style={{ textDecoration: 'none' }}
        >
          {m.label}
        </Link>
      ))}
    </nav>
  )
}

export function ModelPicker({ models, value, onChange }: { models: ModelId[]; value: ModelId; onChange: (m: ModelId) => void }) {
  if (models.length < 2) return null
  return (
    <label className="row" style={{ gap: 8, fontSize: '0.84rem' }}>
      <span className="muted" style={{ color: 'var(--c-text-secondary)' }}>
        모형
      </span>
      <select className="select" style={{ width: 'auto', minHeight: 36 }} value={value} onChange={(e) => onChange(e.target.value as ModelId)}>
        {models.map((m) => (
          <option key={m} value={m}>
            {MODEL_LABEL[m]}
          </option>
        ))}
      </select>
    </label>
  )
}

export function RestoredBanner({ restored }: { restored: string[] }) {
  if (restored.length === 0) return null
  return (
    <div className="note banner" role="status">
      링크의 일부 설정이 올바르지 않아 기본값으로 복원했습니다: {restored.join(', ')}
    </div>
  )
}

export function StatusBar({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="status-bar" aria-label="현재 설정">
      {items.map(([k, v]) => (
        <span key={k}>
          <span className="k">{k}</span>
          {v}
        </span>
      ))}
    </div>
  )
}

export const dirSymbol = (d: Dir, model: ModelId) => (model === 'normal' ? (d === 'R' ? '>' : d === 'L' ? '<' : '≠') : d === 'R' ? '>' : d === 'L' ? '<' : '≠')

export function hypothesisText(s: LabState): string {
  if (s.model === 'tea') return 'H₀: 감별 능력 없음 (무작위 추측)'
  return `H₀: θ = ${s.t0}  대  H₁: θ ${dirSymbol(s.dir, s.model)} ${s.t0}`
}

interface FieldsProps {
  s: LabState
  update: Update
  show: { n?: boolean; t0?: boolean; ts?: boolean; t1?: boolean; sd?: boolean; a?: boolean; dir?: ('R' | 'L' | 'two')[] | false }
  t1Label?: string
  tsLabel?: string
}

/** 모형별 공통 입력 */
export function CommonFields({ s, update, show, t1Label = '대립값 θ₁', tsLabel = '실제 θ* (시뮬레이션)' }: FieldsProps) {
  const rg = ranges(s.model)
  const isNormal = s.model === 'normal'
  const tStep = isNormal ? 0.05 : 0.01
  const fixedN = s.model === 'tea' || s.model === 'table'
  return (
    <div className="settings">
      {show.n && !fixedN && <SliderField label="표본크기 n" value={s.n} min={rg.n.min} max={isNormal ? 100 : 200} step={1} onChange={(v) => update({ n: v })} hint={isNormal ? '1~100' : '1~500 (슬라이더는 200까지, 직접 입력은 500까지)'} />}
      {show.t0 && !fixedN && <SliderField label="귀무값 θ₀" value={s.t0} min={rg.t0.min} max={rg.t0.max} step={tStep} onChange={(v) => update(Math.abs(v - s.t1) < 1e-12 ? { t0: v, t1: Number((v + (isNormal ? 0.5 : v < 0.5 ? 0.2 : -0.2)).toFixed(2)) } : { t0: v })} />}
      {show.t1 && !fixedN && (
        <SliderField label={t1Label} value={s.t1} min={rg.t1.min} max={rg.t1.max} step={tStep} onChange={(v) => (Math.abs(v - s.t0) < 1e-12 ? undefined : update({ t1: v }))} hint="θ₁ ≠ θ₀" />
      )}
      {show.sd && isNormal && <SliderField label="모표준편차 σ (기지)" value={s.sd} min={0.1} max={10} step={0.1} onChange={(v) => update({ sd: v })} />}
      {show.a && <SliderField label="유의수준 α" value={s.a} min={0.001} max={0.2} step={0.001} format={fmtAlpha} onChange={(v) => update({ a: v })} />}
      {show.dir && (
        <Segmented
          label="대립가설의 방향"
          value={s.dir}
          onChange={(d) => update({ dir: d, c: null, rule: 'auto' })}
          options={show.dir.map((d) => ({ value: d, label: d === 'R' ? '우측 (>)' : d === 'L' ? '좌측 (<)' : '양측 (≠)' }))}
        />
      )}
      {show.ts && s.model !== 'tea' && s.model !== 'table' && (
        <SliderField label={tsLabel} value={s.ts} min={rg.ts.min} max={rg.ts.max} step={tStep} onChange={(v) => update({ ts: v })} hint="자료를 실제로 생성하는 값. 규칙·p-값은 바뀌지 않는다." />
      )}
    </div>
  )
}

/** 안내 학습에 임베드할 때는 모듈 자체 설명 칸을 숨긴다 (단계 본문이 설명을 맡음) */
export const EmbedContext = createContext(false)

export function LabLayout({ explain, chart, settings }: { explain: ReactNode; chart: ReactNode; settings: ReactNode }) {
  const embedded = useContext(EmbedContext)
  return (
    <div className={`lab-grid${embedded ? ' no-explain' : ''}`}>
      {!embedded && <aside className="col-explain panel explain">{explain}</aside>}
      <section className="col-chart">{chart}</section>
      <aside className="col-settings settings">{settings}</aside>
    </div>
  )
}

/** 실행 시 시드가 없으면 새로 만들고 URL에 기록 */
export function ensureSeed(s: LabState, update: Update): number {
  if (s.seed !== null) return s.seed
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  update({ seed: buf[0] })
  return buf[0]
}

export function verdict(reject: boolean): ReactNode {
  return <div className={`verdict ${reject ? 'reject' : 'keep'}`}>{reject ? 'H₀ 기각' : 'H₀를 기각하지 못함'}</div>
}
