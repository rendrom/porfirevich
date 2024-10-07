import { useAppStore } from '../stores/app';
import { getAuthHeaders } from '../utils/getAuthHeaders';
import { getQueryString } from '../utils/getQueryString';

import type { StoriesResponse, Story } from '../../../shared/types/Story';
import type { GetStoriesOptions } from '../interfaces';

export default {
  async one(id: string) {
    const appModule = useAppStore();
    const token = appModule.token;
    const resp = await fetch('/api/story/' + id, { ...getAuthHeaders(token) });
    const json = (await resp.json()) as Story;
    return json;
  },

  async all(opt?: GetStoriesOptions) {
    const appModule = useAppStore();
    const resp = await fetch('/api/story/' + (opt ? getQueryString(opt) : ''), {
      ...getAuthHeaders(appModule.token),
    });
    const json = (await resp.json()) as StoriesResponse;
    return json;
  },

  async like(story: Story) {
    const appModule = useAppStore();
    const token = appModule.token;
    if (token) {
      await fetch('/api/story/' + story.id + '/like', {
        method: 'POST',
        ...getAuthHeaders(token),
      });
      return true;
    }
    throw new Error('No user set');
  },

  async dislike(story: Story) {
    const appModule = useAppStore();
    const token = appModule.token;
    if (token) {
      await fetch('/api/story/' + story.id + '/dislike', {
        method: 'POST',
        ...getAuthHeaders(token),
      });
      return true;
    }
    throw new Error('No user set');
  },

  async violation(story: Story) {
    const appModule = useAppStore();
    const token = appModule.token;

    await fetch('/api/story/' + story.id + '/violation', {
      method: 'POST',
      ...getAuthHeaders(token),
    });
    return true;
  },

  async create(
    data: {
      content: string;
      description?: string;
    },
    opt: { token?: string } = {},
  ) {
    const resp = await fetch('/api/story', {
      method: 'POST',
      body: JSON.stringify(data),
      ...getAuthHeaders(opt.token),
    });
    const json = (await resp.json()) as Story;
    return json;
  },

  async edit(id: string, data: Partial<Story>) {
    const appModule = useAppStore();
    const token = appModule.token;
    const resp = await fetch('/api/story/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...getAuthHeaders(token),
    });
    const json = (await resp.json()) as Story;
    return json;
  },
};
