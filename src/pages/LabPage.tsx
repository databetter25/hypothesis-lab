import { Navigate, useParams } from 'react-router-dom'
import { MODULES, type ModuleId } from '../state/labState'
import { useLabState } from '../state/labState'
import { ModelPicker, ModuleTabs, RestoredBanner } from '../modules/common'
import { useState } from 'react'
import { MODULE_COMPONENTS } from '../modules/registry'

export function LabPage() {
  const { module } = useParams()
  const def = MODULES.find((m) => m.id === module)
  if (!def) return <Navigate to="/lab/pvalue" replace />
  return <Lab moduleId={def.id} />
}

function Lab({ moduleId }: { moduleId: ModuleId }) {
  const def = MODULES.find((m) => m.id === moduleId)!
  const { state, restored, update } = useLabState(def.models)
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* 클립보드 권한이 없으면 무시 */
    }
  }

  const Body = MODULE_COMPONENTS[moduleId]

  return (
    <div className="container wide">
      <div className="lab-head">
        <p className="eyebrow">자유 실험 · {def.feature}</p>
        <h1>{def.label}</h1>
      </div>
      <div className="lab-modules">
        <ModuleTabs current={moduleId} model={state.model} />
      </div>
      <div className="lab-modules" style={{ justifyContent: 'space-between' }}>
        <ModelPicker models={def.models} value={state.model} onChange={(m) => update({ model: m })} />
        <button className="btn-ghost" onClick={copyLink}>
          {copied ? '✓ 링크 복사됨' : '🔗 현재 설정 링크 복사'}
        </button>
      </div>
      <RestoredBanner restored={restored} />
      <Body s={state} update={update} />
    </div>
  )
}
