import config from '@shared/config';

import Delta from 'quill-delta';

import type { SchemeToHtmlOptions } from '../interfaces';
import type { Scheme } from '@shared/types/Scheme';

export function deltaToScheme(delta: Delta): Scheme {
  return delta.ops.map((x) => {
    return [x.insert as string, x.attributes && x.attributes.bold ? 1 : 0];
  });
}

export function schemeToDelta(scheme: Scheme): Delta {
  const ops: Delta['ops'] = scheme.map((x) => {
    const op: Delta['ops'][0] = { insert: x[0] };
    if (x[1]) {
      op.attributes = { bold: true, color: config.primaryColor };
    }
    return op;
  });

  const delta = new Delta();
  delta.ops = ops;

  return delta;
}

export function schemeToHtml(scheme: Scheme, opt?: SchemeToHtmlOptions) {
  const color = (opt && opt.color) || config.primaryColor;
  return scheme.reduce((a, b) => {
    const str = b[0];
    a += b[1] ? `<strong style="color:${color};">${str}</strong>` : str;
    return a;
  }, '');
}
