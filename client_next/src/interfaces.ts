import type { DeltaOperation } from 'quill';

export interface Delta {
  ops: DeltaOperation[];
}

export interface SchemeToHtmlOptions {
  color?: string;
}

export interface TransformResp {
  replies?: string[];
  detail?: string;
}

export interface GenerateApiOptions {
  prompt: string;
  model: string;
  length: number;
  signal: AbortSignal;
}

export type StoryResponseSelect =
  | 'id'
  | 'content'
  | 'createdAt'
  | 'viewsCount'
  | 'postcard';

export interface GetStoriesOptions {
  limit?: number;
  offset?: number;
  orderBy?: string[];
  afterDate?: number;
  filter?: string;
  query?: string;
  tags?: string;
}

export type FilterType = 'all' | 'my' | 'favorite';
export type SortType = 'random' | 'new' | 'popular';
export type Period = 'all' | 'week' | 'month' | '6-months';

export interface StoriesQueryParams {
  filter?: FilterType;
  sort?: SortType;
  period?: Period;
  query?: string;
}
