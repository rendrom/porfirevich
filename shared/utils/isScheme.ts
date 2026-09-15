import type { Scheme } from '../types/Scheme';

export function isScheme(value: unknown): value is Scheme {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        Array.isArray(item) &&
        item.length === 2 &&
        typeof item[0] === 'string' &&
        (item[1] === 0 || item[1] === 1),
    )
  );
}
