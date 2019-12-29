import { Delta, Scheme } from '../interfaces';
import { DeltaOperation } from 'quill';
import { PRIMARY_COLOR } from '../config';

export function deltaToScheme(delta: Delta): Scheme {
  return delta.ops.map(x => {
    return [x.insert, x.attributes ? 1 : 0]
  })
}

export function schemeToDelta(scheme: Scheme): Delta {

  return {
    ops: scheme.map(x => {
      const op: DeltaOperation = {insert: x[0]}
      if (x[1]) {
        op.attributes = { bold: true, color: PRIMARY_COLOR}
      }
      return op
    })
  }
}
