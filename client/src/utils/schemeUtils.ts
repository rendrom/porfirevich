import config from '@shared/config';

import type { SchemeToHtmlOptions } from '../interfaces';
import type { Scheme } from '@shared/types/Scheme';

export function schemeToHtml(scheme: Scheme, opt?: SchemeToHtmlOptions) {
  const color = (opt && opt.color) || config.primaryColor;
  return scheme.reduce((a, b) => {
    const str = b[0];
    a += b[1] ? `<strong style="color:${color};">${str}</strong>` : str;
    return a;
  }, '');
}
