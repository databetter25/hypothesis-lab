import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmbedContext } from '../modules/common'
import { MODULE_COMPONENTS } from '../modules/registry'
import { MODULES, defaultsFor, serializeLab, type LabState } from '../state/labState'
import { progress, useProgress } from '../lib/progress'
import type { Checkpoint, Experiment, Step } from '../content/learn'

/* ---------- 실험 임베드: URL 대신 로컬 상태로 모듈을 띄운다 ---------- */

function initial(exp: Experiment): LabState {
  const model = exp.patch.model ?? MODULES.find((m) => m.id === exp.module)!.models[0]
  return { ...defaultsFor(model), ...exp.patch, model, seed: exp.patch.seed ?? null }
}

export function EmbeddedLab({ exp }: { exp: Experiment }) {
  const [s, setS] = useState<LabState>(() => initial(exp))
  const update = useCallback((patch: Partial<LabState>) => {
    setS((cur) => {
      let next: LabState = { ...cur, ...patch }
      if (patch.model && patch.model !== cur.model) next = { ...defaultsFor(patch.model), a: cur.a, B: cur.B, seed: cur.seed }
      if (next.model === 'coin' && next.x > next.n) next.x = next.n
      return next
    })
  }, [])
  const Body = MODULE_COMPONENTS[exp.module]
  return (
    <div>
      <EmbedContext.Provider value={true}>
        <Body s={s} update={update} />
      </EmbedContext.Provider>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: -24, marginBottom: 8 }}>
        <button className="btn-ghost" onClick={() => setS(initial(exp))}>
          ↺ 이 단계의 처음 설정으로
        </button>
        <Link className="btn-ghost" to={`/lab/${exp.module}?${serializeLab(s).toString()}`}>
          자유 실험에서 이어서 하기 →
        </Link>
      </div>
    </div>
  )
}

export function ExperimentTabs({ step }: { step: Step }) {
  const [i, setI] = useState(0)
  if (step.experiments.length === 0) return null
  const exp = step.experiments[Math.min(i, step.experiments.length - 1)]
  return (
    <div>
      {step.experiments.length > 1 && (
        <div className="tab-nav" role="tablist" aria-label="실험 선택" style={{ marginBottom: 16 }}>
          {step.experiments.map((e, k) => (
            <button key={e.label} role="tab" aria-selected={k === i} className={`tab-btn${k === i ? ' active' : ''}`} onClick={() => setI(k)}>
              {e.label}
            </button>
          ))}
        </div>
      )}
      <EmbeddedLab key={`${step.n}-${i}`} exp={exp} />
    </div>
  )
}

/* ---------- 예상하기 ---------- */

export function PredictBox({ step }: { step: Step }) {
  const p = useProgress()
  const key = String(step.n)
  const value = p.predictions[key] ?? ''
  const revealed = p.revealed[`predict-${key}`]
  return (
    <div className="learn-card">
      <p className="learn-label">① 예상하기</p>
      <p className="learn-prompt">{step.predict.prompt}</p>
      {step.predict.choices ? (
        <div className="choice-list compact" role="radiogroup" aria-label="예상">
          {step.predict.choices.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={value === c} className={`choice${value === c ? ' picked' : ''}`} onClick={() => progress.predict(key, c)}>
              {c}
            </button>
          ))}
        </div>
      ) : (
        <textarea className="text-input" rows={3} placeholder="자유롭게 적어 보세요 (선택). 이 기기에만 저장됩니다." value={value} onChange={(e) => progress.predict(key, e.target.value)} aria-label="예상 답" />
      )}
      {revealed ? (
        <div className="note blue" style={{ marginTop: 12 }}>
          {value && <div style={{ marginBottom: 6 }}>내 예상: {value}</div>}
          {step.predict.answer}
        </div>
      ) : (
        <button className="btn-outline sm" style={{ marginTop: 12 }} onClick={() => progress.reveal(`predict-${key}`)}>
          {value ? '해설 보기' : '예상 없이 해설 보기'}
        </button>
      )}
    </div>
  )
}

/* ---------- 설명하기 (클릭 후 공개) ---------- */

export function ExplainBox({ step }: { step: Step }) {
  const p = useProgress()
  const revealed = p.revealed[`explain-${step.n}`]
  return (
    <div className="learn-card">
      <p className="learn-label">③ 설명하기</p>
      {revealed ? (
        <div className="learn-explain">{step.explain}</div>
      ) : (
        <>
          <p className="muted" style={{ color: 'var(--c-text-secondary)' }}>
            실험에서 본 것을 먼저 스스로 정리해 본 뒤 해설을 펼쳐 보세요.
          </p>
          <button className="btn-filled sm" onClick={() => progress.reveal(`explain-${step.n}`)}>
            해설 펼치기
          </button>
        </>
      )}
    </div>
  )
}

/* ---------- 체크포인트 ---------- */

export function CheckpointBox({ cp }: { cp: Checkpoint }) {
  const p = useProgress()
  const picked = p.answers[cp.id]
  const answered = picked !== undefined
  const right = picked === cp.correct
  return (
    <div className="checkpoint">
      <p className="learn-prompt">
        <span className="badge badge-gray" style={{ marginRight: 8 }}>
          {cp.id}
        </span>
        {cp.q}
      </p>
      <div className="choice-list" role="radiogroup" aria-label={`${cp.id} 선택지`}>
        {cp.options.map((o, i) => {
          const cls = answered ? (i === cp.correct ? ' correct' : i === picked ? ' wrong' : '') : ''
          return (
            <button key={i} type="button" role="radio" aria-checked={picked === i} className={`choice${cls}`} onClick={() => progress.answer(cp.id, i)}>
              <span className="choice-num">{i + 1}</span>
              {o}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`verdict ${right ? 'keep' : 'reject'}`} style={{ marginTop: 10 }} role="status">
          {right ? '정답입니다. ' : '다시 생각해 보세요. '}
          <span style={{ fontWeight: 400 }}>{cp.explain}</span>
        </div>
      )}
    </div>
  )
}
