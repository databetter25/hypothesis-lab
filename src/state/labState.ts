// 실험실 설정 ↔ URL 쿼리. URL이 단일 진실원이다 (PRD v3 §17.4).
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export type ModelId = 'coin' | 'normal' | 'table' | 'tea' | 'gof' | 'indep' | 't1' | 't2' | 'seq' | 'multi' | 'pois' | 'nvar'
export type ModuleId = 'pvalue' | 'errors' | 'power' | 'pdist' | 'np' | 'lrt' | 'chisq' | 'ci' | 'ttest' | 'pitfalls' | 'more'
export type Dir = 'R' | 'L' | 'two'

export interface LabState {
  model: ModelId
  n: number
  t0: number
  t1: number
  ts: number
  sd: number
  a: number
  dir: Dir
  x: number
  rule: 'auto' | 'manual'
  c: number | null
  B: number
  seed: number | null
  f0: string[]
  f1: string[]
  /** 이산 모형의 사용자 지정 기각역 (구간 인코딩) */
  R: string
  /** χ² 적합도의 귀무 확률 (분수 허용) */
  p0: string[]
  /** χ²검정 관측도수: 행은 '/', 칸은 ',' */
  obs: string
  /** t검정: 둘째 표본의 크기·평균·표준편차, 시뮬레이션의 참 표준편차 */
  n2: number
  y: number
  sd2: number
  sig: number
  sig2: number
  /** 선택적 중단: 첫 엿보기 시점, 엿보기 간격 (n은 최대 표본크기) */
  nmin: number
  step: number
  /** 다중검정: 검정 수, 참인 귀무 수, 효과크기(z 척도) */
  m: number
  m0: number
  eff: number
}

export const MODEL_LABEL: Record<ModelId, string> = {
  coin: '동전 (이항)',
  normal: '정규 평균 (σ 기지)',
  table: '이산 확률표',
  tea: '홍차 감별',
  gof: '적합도 (다항분포)',
  indep: '분할표 독립성',
  t1: '한 표본 t (σ 미지)',
  t2: '두 표본 t',
  seq: '선택적 중단 (엿보기)',
  multi: '다중검정',
  pois: '포아송 평균',
  nvar: '정규 분산 (μ 기지)',
}

export const MODULES: { id: ModuleId; label: string; models: ModelId[]; feature: string }[] = [
  { id: 'pvalue', label: 'p-값과 기각역', models: ['coin', 'normal', 'tea'], feature: 'F02' },
  { id: 'errors', label: '두 오류', models: ['normal', 'coin', 'table'], feature: 'F03' },
  { id: 'power', label: '검정력함수', models: ['normal', 'coin'], feature: 'F04' },
  { id: 'pdist', label: 'p-값의 분포', models: ['coin', 'normal'], feature: 'F05' },
  { id: 'np', label: '최강력검정', models: ['table', 'coin', 'normal'], feature: 'F06·F07' },
  { id: 'lrt', label: '가능도비검정', models: ['coin', 'normal'], feature: 'F08·F09' },
  { id: 'chisq', label: 'χ²검정', models: ['gof', 'indep'], feature: 'F14' },
  { id: 'ci', label: '신뢰구간과 검정', models: ['coin', 'normal'], feature: 'F15' },
  { id: 'ttest', label: 't검정', models: ['t1', 't2'], feature: 'F16' },
  { id: 'more', label: '포아송·정규 분산', models: ['pois', 'nvar'], feature: 'F17' },
  { id: 'pitfalls', label: '오용 체험', models: ['seq', 'multi'], feature: 'F18' },
]

export const B_CHOICES = [100, 1000, 10000] as const

const MODEL_DEFAULTS: Record<ModelId, Partial<LabState>> = {
  coin: { n: 20, t0: 0.5, t1: 0.7, ts: 0.5, x: 14 },
  normal: { n: 10, t0: 0, t1: 0.5, ts: 0, sd: 1, x: 0.6 },
  table: { f0: ['.4', '.3', '.2', '.1'], f1: ['.2', '.2', '.3', '.3'] },
  tea: { x: 4 },
  gof: { p0: ['9/16', '3/16', '3/16', '1/16'], obs: '315,101,108,32' },
  indep: { obs: '20,30,25/30,20,25' },
  t1: { n: 10, x: 0.6, sd: 1.2, t0: 0, ts: 0, sig: 1, dir: 'two' },
  t2: { n: 12, x: 5.2, sd: 1.5, n2: 15, y: 4.1, sd2: 2, t0: 0, ts: 0, sig: 1, sig2: 1, dir: 'two' },
  seq: { n: 100, nmin: 10, step: 10, t0: 0.5, ts: 0.5, dir: 'two' },
  multi: { m: 20, m0: 15, eff: 2.5 },
  pois: { n: 10, t0: 0.3, t1: 0.1, ts: 0.3, x: 1, a: 0.05 },
  nvar: { n: 5, t0: 1, t1: 1.5, ts: 1, x: 9, a: 0.05 },
}

const BASE: LabState = {
  model: 'coin',
  n: 20,
  t0: 0.5,
  t1: 0.7,
  ts: 0.5,
  sd: 1,
  a: 0.05,
  dir: 'R',
  x: 14,
  rule: 'auto',
  c: null,
  B: 1000,
  seed: null,
  f0: ['.4', '.3', '.2', '.1'],
  f1: ['.2', '.2', '.3', '.3'],
  R: '',
  p0: ['9/16', '3/16', '3/16', '1/16'],
  obs: '315,101,108,32',
  n2: 15,
  y: 4.1,
  sd2: 2,
  sig: 1,
  sig2: 1,
  nmin: 10,
  step: 10,
  m: 20,
  m0: 15,
  eff: 2.5,
}

export function defaultsFor(model: ModelId): LabState {
  return { ...BASE, ...MODEL_DEFAULTS[model], model }
}

interface Range {
  min: number
  max: number
  int?: boolean
}

export function ranges(model: ModelId): Record<'n' | 't0' | 't1' | 'ts' | 'sd' | 'a', Range> {
  if (model === 'pois' || model === 'nvar')
    return {
      n: { min: 1, max: 200, int: true },
      t0: { min: 0.01, max: 50 },
      t1: { min: 0.01, max: 50 },
      ts: { min: 0.01, max: 50 },
      sd: { min: 0.1, max: 10 },
      a: { min: 0.001, max: 0.2 },
    }
  if (model === 't1' || model === 't2')
    return {
      n: { min: 2, max: 200, int: true },
      t0: { min: -1e4, max: 1e4 },
      t1: { min: -1e4, max: 1e4 },
      ts: { min: -1e4, max: 1e4 },
      sd: { min: 0.001, max: 1e4 },
      a: { min: 0.001, max: 0.2 },
    }
  if (model === 'normal')
    return {
      n: { min: 1, max: 100, int: true },
      t0: { min: -5, max: 5 },
      t1: { min: -5, max: 5 },
      ts: { min: -5, max: 5 },
      sd: { min: 0.1, max: 10 },
      a: { min: 0.001, max: 0.2 },
    }
  return {
    n: { min: 1, max: 500, int: true },
    t0: { min: 0.01, max: 0.99 },
    t1: { min: 0.01, max: 0.99 },
    ts: { min: 0, max: 1 },
    sd: { min: 0.1, max: 10 },
    a: { min: 0.001, max: 0.2 },
  }
}

export interface ParsedLab {
  state: LabState
  restored: string[]
}

const KEY_LABEL: Record<string, string> = {
  model: '모형', n: '표본크기 n', t0: 'θ₀', t1: 'θ₁', ts: '실제 θ', sd: 'σ', a: '유의수준 α', dir: '방향',
  x: '관측값', rule: '규칙 모드', c: '임계값 c', B: '반복 횟수 B', seed: '시드', f0: 'f₀', f1: 'f₁', R: '기각역',
}

export function parseLab(sp: URLSearchParams, forcedModel?: ModelId): ParsedLab {
  const restored: string[] = []
  const rawModel = sp.get('model')
  let model: ModelId = 'coin'
  if (forcedModel) model = forcedModel
  else if (rawModel && ['coin', 'normal', 'table', 'tea', 'gof', 'indep', 't1', 't2', 'seq', 'multi', 'pois', 'nvar'].includes(rawModel)) model = rawModel as ModelId
  else if (rawModel) restored.push(KEY_LABEL.model)
  const s = defaultsFor(model)
  const rg = ranges(model)

  const num = (key: keyof typeof rg) => {
    const raw = sp.get(key)
    if (raw === null) return
    const v = Number(raw)
    const r = rg[key]
    if (!Number.isFinite(v) || v < r.min || v > r.max || (r.int && !Number.isInteger(v))) {
      restored.push(KEY_LABEL[key])
      return
    }
    ;(s[key] as number) = v
  }
  ;(['n', 't0', 't1', 'ts', 'sd', 'a'] as const).forEach(num)

  if (model === 'tea') s.n = 8
  if (model !== 'normal' && Math.abs(s.t1 - s.t0) < 1e-12) {
    s.t1 = defaultsFor(model).t1 === s.t0 ? Math.min(0.99, s.t0 + 0.2) : defaultsFor(model).t1
    restored.push(KEY_LABEL.t1)
  }
  if (model === 'normal' && s.t1 === s.t0) {
    s.t1 = s.t0 + 0.5
    restored.push(KEY_LABEL.t1)
  }

  const dir = sp.get('dir')
  if (dir !== null) {
    if (dir === 'R' || dir === 'L' || dir === 'two') s.dir = dir
    else restored.push(KEY_LABEL.dir)
  }

  const x = sp.get('x')
  if (x !== null) {
    const v = Number(x)
    const continuous = model === 'normal' || model === 't1' || model === 't2' || model === 'nvar'
    const maxX = model === 'coin' ? s.n : model === 'tea' ? 4 : model === 'table' ? 7 : Infinity
    if (!Number.isFinite(v) || (!continuous && (!Number.isInteger(v) || v < 0))) restored.push(KEY_LABEL.x)
    else if (v > maxX) {
      s.x = maxX
      restored.push(KEY_LABEL.x)
    } else s.x = v
  } else if (model === 'coin' && s.x > s.n) s.x = s.n

  const rule = sp.get('rule')
  if (rule === 'auto' || rule === 'manual') s.rule = rule
  else if (rule !== null) restored.push(KEY_LABEL.rule)

  const c = sp.get('c')
  if (c !== null) {
    const v = Number(c)
    if (Number.isFinite(v)) s.c = v
    else restored.push(KEY_LABEL.c)
  }

  const B = sp.get('B')
  if (B !== null) {
    const v = Number(B)
    if ((B_CHOICES as readonly number[]).includes(v)) s.B = v
    else restored.push(KEY_LABEL.B)
  }

  const seed = sp.get('seed')
  if (seed !== null) {
    const v = Number(seed)
    if (Number.isInteger(v) && v >= 0 && v <= 0xffffffff) s.seed = v
    else restored.push(KEY_LABEL.seed)
  }

  const f0 = sp.get('f0')
  const f1 = sp.get('f1')
  if (f0 !== null) s.f0 = f0.split(',')
  if (f1 !== null) s.f1 = f1.split(',')
  const R = sp.get('R')
  if (R !== null) s.R = R
  const p0 = sp.get('p0')
  if (p0 !== null) s.p0 = p0.split(',')
  const obs = sp.get('obs')
  if (obs !== null) s.obs = obs
  const posNum = (key: 'y' | 'sd2' | 'sig' | 'sig2' | 'n2', label: string, cond: (v: number) => boolean) => {
    const raw = sp.get(key)
    if (raw === null) return
    const v = Number(raw)
    if (Number.isFinite(v) && cond(v)) s[key] = v
    else restored.push(label)
  }
  posNum('n2', '둘째 표본크기', (v) => Number.isInteger(v) && v >= 2 && v <= 200)
  posNum('y', '둘째 표본평균', () => true)
  posNum('sd2', '둘째 표본표준편차', (v) => v > 0)
  posNum('sig', '참 표준편차', (v) => v > 0)
  posNum('sig2', '둘째 참 표준편차', (v) => v > 0)
  const intIn = (key: 'nmin' | 'step' | 'm' | 'm0', label: string, lo: number, hi: number) => {
    const raw = sp.get(key)
    if (raw === null) return
    const v = Number(raw)
    if (Number.isInteger(v) && v >= lo && v <= hi) s[key] = v
    else restored.push(label)
  }
  intIn('nmin', '첫 엿보기 시점', 1, 1000)
  intIn('step', '엿보기 간격', 1, 1000)
  intIn('m', '검정 수', 1, 500)
  intIn('m0', '참인 귀무 수', 0, 500)
  if (s.m0 > s.m) {
    s.m0 = s.m
    restored.push('참인 귀무 수')
  }
  if (s.nmin > s.n && model === 'seq') {
    s.nmin = s.n
    restored.push('첫 엿보기 시점')
  }
  const eff = sp.get('eff')
  if (eff !== null) {
    const v = Number(eff)
    if (Number.isFinite(v) && v >= 0 && v <= 10) s.eff = v
    else restored.push('효과크기')
  }

  return { state: s, restored }
}

export function serializeLab(s: LabState): URLSearchParams {
  const p = new URLSearchParams()
  p.set('model', s.model)
  if (s.model === 'pois' || s.model === 'nvar') {
    for (const k of ['n', 't0', 't1', 'ts', 'x', 'a', 'B'] as const) p.set(k, String(s[k]))
    if (s.seed !== null) p.set('seed', String(s.seed))
    return p
  }
  if (s.model === 'seq' || s.model === 'multi') {
    if (s.model === 'seq') {
      p.set('n', String(s.n))
      p.set('nmin', String(s.nmin))
      p.set('step', String(s.step))
      p.set('t0', String(s.t0))
      p.set('ts', String(s.ts))
    } else {
      p.set('m', String(s.m))
      p.set('m0', String(s.m0))
      p.set('eff', String(s.eff))
    }
    p.set('a', String(s.a))
    p.set('B', String(s.B))
    if (s.seed !== null) p.set('seed', String(s.seed))
    return p
  }
  if (s.model === 't1' || s.model === 't2') {
    p.set('n', String(s.n))
    p.set('x', String(s.x))
    p.set('sd', String(s.sd))
    if (s.model === 't2') {
      p.set('n2', String(s.n2))
      p.set('y', String(s.y))
      p.set('sd2', String(s.sd2))
      p.set('sig2', String(s.sig2))
    }
    p.set('t0', String(s.t0))
    p.set('ts', String(s.ts))
    p.set('sig', String(s.sig))
    p.set('a', String(s.a))
    p.set('dir', s.dir)
    p.set('B', String(s.B))
    if (s.seed !== null) p.set('seed', String(s.seed))
    return p
  }
  if (s.model === 'gof' || s.model === 'indep') {
    p.set('a', String(s.a))
    if (s.model === 'gof') p.set('p0', s.p0.join(','))
    p.set('obs', s.obs)
    p.set('B', String(s.B))
    if (s.seed !== null) p.set('seed', String(s.seed))
    return p
  }
  if (s.model !== 'tea' && s.model !== 'table') p.set('n', String(s.n))
  if (s.model === 'coin' || s.model === 'normal') {
    p.set('t0', String(s.t0))
    p.set('t1', String(s.t1))
    p.set('ts', String(s.ts))
  }
  if (s.model === 'normal') p.set('sd', String(s.sd))
  p.set('a', String(s.a))
  p.set('dir', s.dir)
  p.set('x', String(s.x))
  if (s.rule !== 'auto') p.set('rule', s.rule)
  if (s.c !== null) p.set('c', String(s.c))
  p.set('B', String(s.B))
  if (s.seed !== null) p.set('seed', String(s.seed))
  if (s.model === 'table') {
    p.set('f0', s.f0.join(','))
    p.set('f1', s.f1.join(','))
  }
  if (s.R) p.set('R', s.R)
  return p
}

/** 실험실 상태 훅 */
export function useLabState(supported: ModelId[]) {
  const [sp, setSp] = useSearchParams()
  const parsed = useMemo(() => {
    const raw = sp.get('model') as ModelId | null
    const forced = raw && !supported.includes(raw) ? supported[0] : !raw ? supported[0] : undefined
    const p = parseLab(sp, forced)
    if (raw && forced) p.restored.unshift(`모형(이 모듈은 ${MODEL_LABEL[raw] ?? raw}을 지원하지 않음)`)
    return p
  }, [sp, supported])

  const update = useCallback(
    (patch: Partial<LabState>) => {
      setSp(
        (prev) => {
          const cur = parseLab(prev, parsed.state.model).state
          let next: LabState = { ...cur, ...patch }
          if (patch.model && patch.model !== cur.model) next = { ...defaultsFor(patch.model), a: cur.a, B: cur.B, seed: cur.seed }
          if (next.model === 'coin' && next.x > next.n) next.x = next.n
          return serializeLab(next)
        },
        { replace: true },
      )
    },
    [setSp, parsed.state.model],
  )

  return { state: parsed.state, restored: parsed.restored, update }
}
