import { DeltaOperation } from 'quill';
import { Story } from '../srv/entity/Story';

export interface Delta {
  ops: DeltaOperation[];
}

export interface SchemeToHtmlOptions {
  color?: string;
}

export type StoryResponseSelect = 'id' | 'content' | 'createdAt' | 'viewsCount' | 'postcard';

// export type StoryResponse = Pick<Story, StoryResponseSelect>
export type StoryResponse = Story;

export interface GetStoriesOptions {
  limit?: number;
  offset?: number;
}

export interface StoriesResponse {
  object: 'list';
  hasMore: boolean;
  data: StoryResponse[];
  count: number;
  beforeDate?: number
}

/**
 * 0 - user
 * 1 - AI
 */
export type Scheme = ([string, 0 | 1])[];
