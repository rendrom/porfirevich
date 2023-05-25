import { DeltaOperation } from 'quill';
import { Story } from '../classes/Story';

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

// export type StoryResponse = Pick<Story, StoryResponseSelect>
export type StoryResponse = Story;

export interface GetStoriesOptions {
  limit?: number;
  offset?: number;
  orderBy?: string[];
  afterDate?: number;
  filter?: string;
  query?: string;
  tags?: string;
}

export interface StoriesResponse {
  object: 'list';
  data: StoryResponse[];
}

/**
 * 0 - user
 * 1 - AI
 */
export type Scheme = [string, 0 | 1][];

export type FilterType = 'all' | 'my' | 'favorite';
export type SortType = 'random' | 'new' | 'popular';
export type Period = 'all' | 'week' | 'month' | '6-months';

export interface StoriesQueryParams {
  filter?: FilterType;
  sort?: SortType;
  period?: Period;
  query?: string;
}
