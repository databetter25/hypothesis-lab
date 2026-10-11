// 시뮬레이션 실행 훅. Worker에서 실행하고, 정지는 Worker를 종료해 즉시 처리한다.
// 결과는 실행 당시 설정 키와 함께 보관하며, 설정이 바뀌면 자동으로 버린다 (PRD §8.3-6).
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SimResult, SimSpec } from '../engine/simulate'

export interface SimState {
  status: 'idle' | 'running' | 'done'
  progress: number
  result: SimResult | null
  key: string | null
  elapsedMs: number
}

let nextId = 1

export function useSimulation(currentKey: string) {
  const [state, setState] = useState<SimState>({ status: 'idle', progress: 0, result: null, key: null, elapsedMs: 0 })
  const workerRef = useRef<Worker | null>(null)

  const stop = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    setState((s) => (s.status === 'running' ? { ...s, status: 'idle', progress: 0 } : s))
  }, [])

  useEffect(() => () => workerRef.current?.terminate(), [])

  const run = useCallback(
    (spec: SimSpec, key: string) => {
      workerRef.current?.terminate()
      const w = new Worker(new URL('../workers/sim.worker.ts', import.meta.url), { type: 'module' })
      workerRef.current = w
      const id = nextId++
      const t0 = performance.now()
      setState({ status: 'running', progress: 0, result: null, key, elapsedMs: 0 })
      w.onerror = (e) => {
        console.error('시뮬레이션 Worker 오류', e.message)
        setState((s) => ({ ...s, status: 'idle', progress: 0 }))
      }
      w.onmessage =(e: MessageEvent<{ id: number; type: string; done?: number; res?: SimResult }>) => {
        if (e.data.id !== id) return
        if (e.data.type === 'progress') setState((s) => ({ ...s, progress: (e.data.done ?? 0) / spec.B }))
        else if (e.data.type === 'done') {
          setState({ status: 'done', progress: 1, result: e.data.res ?? null, key, elapsedMs: performance.now() - t0 })
          w.terminate()
          if (workerRef.current === w) workerRef.current = null
        }
      }
      w.postMessage({ id, spec })
    },
    [],
  )

  const valid = state.key === currentKey
  return {
    status: valid ? state.status : 'idle',
    progress: valid ? state.progress : 0,
    result: valid ? state.result : null,
    elapsedMs: state.elapsedMs,
    run,
    stop,
  }
}
