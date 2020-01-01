import { DeltaOperation } from 'quill';

export interface Delta {
  ops: DeltaOperation[];
}

export interface SchemeToHtmlOptions {
  color?: string;
}

/**
 * 0 - user
 * 1 - AI
 */
export type Scheme = ([string, 0 | 1])[];
