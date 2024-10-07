import { useAppStore } from '../store/app';

import type { Scheme } from '@shared/types/Scheme';

export function checkCorrupted(scheme: Scheme) {
  const appModule = useAppStore();

  const porfirParts = scheme.filter((x) => x[1] === 1);
  const corruptedParts = porfirParts.filter((x) => {
    return !appModule.replies.find((y) => y.indexOf(x[0]) !== -1);
  });
  const isCorrupted = corruptedParts.length !== 0;
  return isCorrupted;
}
