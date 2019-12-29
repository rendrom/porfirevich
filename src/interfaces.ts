import { DeltaOperation } from 'quill';

export interface Delta {
  ops: DeltaOperation[];
}

/**
 * 0 - user
 * 1 - AI
 */
export type Scheme = ([string, 0 | 1])[];
