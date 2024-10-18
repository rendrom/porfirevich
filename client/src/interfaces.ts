import type D from 'quill-delta';

// export interface Delta {
//   ops: DeltaOperation[];
// }

export type Delta = D;

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
  tokens: number;
  signal: AbortSignal;
  temperature?: number;
}

export type StoryResponseSelect =
  | 'id'
  | 'content'
  | 'createdAt'
  | 'viewsCount'
  | 'postcard';

// export type StoryResponse = Pick<Story, StoryResponseSelect>

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
