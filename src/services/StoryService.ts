import {
  StoriesResponse,
  StoryResponse,
  GetStoriesOptions
} from '../interfaces';
import { getQueryString } from '../utils/getQueryString';
import { Story } from '../../classes/Story';
import { getAuthHeaders } from '@/utils/getAuthHeaders';
import { appModule } from '../store/app';

export default {
  async one(id: string) {
    const token = appModule.token;
    const resp = await fetch('/api/story/' + id, { ...getAuthHeaders(token) });
    const json = (await resp.json()) as StoryResponse;
    return json;
  },

  async all(opt?: GetStoriesOptions) {
    const resp = await fetch('/api/story/' + (opt ? getQueryString(opt) : ''), {
      ...getAuthHeaders(appModule.token)
    });
    const json = (await resp.json()) as StoriesResponse;
    return json;
  },

  async like(story: Story) {
    const token = appModule.token;
    if (token) {
      await fetch('/api/story/' + story.id + '/like', {
        method: 'POST',
        ...getAuthHeaders(token)
      });
      return true;
    }
    throw new Error('No user set');
  },

  async dislike(story: Story) {
    const token = appModule.token;
    if (token) {
      await fetch('/api/story/' + story.id + '/dislike', {
        method: 'POST',
        ...getAuthHeaders(token)
      });
      return true;
    }
    throw new Error('No user set');
  },

  async violation(story: Story) {
    const token = appModule.token;

    await fetch('/api/story/' + story.id + '/violation', {
      method: 'POST',
      ...getAuthHeaders(token)
    });
    return true;
  },

  async create(
    data: {
      content: string;
      description?: string;
    },
    opt: { token?: string } = {}
  ) {
    const resp = await fetch('/api/story', {
      method: 'POST',
      body: JSON.stringify(data),
      ...getAuthHeaders(opt.token)
    });
    const json = (await resp.json()) as StoryResponse;
    return json;
  },

  async edit(id: string, data: Partial<Story>) {
    const token = appModule.token;
    const resp = await fetch('/api/story/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...getAuthHeaders(token)
    });
    const json = (await resp.json()) as StoryResponse;
    return json;
  }
};
