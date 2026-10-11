/// <reference lib="webworker" />
import { simulate, type SimSpec } from '../engine/simulate'

self.onmessage = (e: MessageEvent<{ id: number; spec: SimSpec }>) => {
  const { id, spec } = e.data
  const res = simulate(spec, (done) => self.postMessage({ id, type: 'progress', done }), Math.max(100, Math.floor(spec.B / 20)))
  const transfer = [res.values?.buffer, res.values2?.buffer].filter((b): b is ArrayBuffer => !!b)
  self.postMessage({ id, type: 'done', res }, { transfer })
}
