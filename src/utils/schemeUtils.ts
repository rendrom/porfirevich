import { Delta, Scheme, SchemeToHtmlOptions } from '../interfaces';
import { DeltaOperation } from 'quill';
import config from '../../config';

export function deltaToScheme (delta: Delta): Scheme {
  return delta.ops.map(x => {
    return [x.insert, (x.attributes && x.attributes.bold) ? 1 : 0];
  });
}

export function schemeToDelta (scheme: Scheme): Delta {
  return {
    ops: scheme.map(x => {
      const op: DeltaOperation = { insert: x[0] };
      if (x[1]) {
        op.attributes = { bold: true, color: config.primaryColor };
      }
      return op;
    })
  };
}

export function schemeToHtml (scheme: Scheme, opt?: SchemeToHtmlOptions) {
  const color = (opt && opt.color) || config.primaryColor;
  return scheme.reduce((a, b) => {
    const str = b[0];
    a += b[1] ? `<strong style="color:${color};">${str}</strong>` : str;
    return a;
  }, '');
}
