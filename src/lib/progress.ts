// 안내 학습 진행 상태. 기기(localStorage)에만 저장하고 서버로 보내지 않는다 (PRD §17.6).
// 저장소 접근이 막혀도 메모리 상태로 정상 동작한다.
import { useSyncExternalStore } from 'react'

export interface Progress {
  completed: Record<string, boolean>
  predictions: Record<string, string>
  /** 체크포인트 응답: 문항 ID → 선택지 번호 */
  answers: Record<string, number>
  revealed: Record<string, boolean>
}

const KEY = 'hypothesis-lab.learn.v1'
const EMPTY: Progress = { completed: {}, predictions: {}, answers: {}, revealed: {} }

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const p = JSON.parse(raw) as Partial<Progress>
    return { ...EMPTY, ...p }
  } catch {
    return EMPTY
  }
}

let state: Progress = load()
const listeners = new Set<() => void>()

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 사생활 보호 모드 등: 메모리에만 유지 */
  }
}

function set(next: Progress) {
  state = next
  save()
  listeners.forEach((l) => l())
}

export const progress = {
  complete(step: string, done = true) {
    set({ ...state, completed: { ...state.completed, [step]: done } })
  },
  predict(step: string, text: string) {
    set({ ...state, predictions: { ...state.predictions, [step]: text } })
  },
  answer(qid: string, choice: number) {
    set({ ...state, answers: { ...state.answers, [qid]: choice } })
  },
  reveal(key: string) {
    set({ ...state, revealed: { ...state.revealed, [key]: true } })
  },
  reset() {
    set(EMPTY)
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* 무시 */
    }
  },
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => {
        listeners.delete(cb)
      }
    },
    () => state,
  )
}
