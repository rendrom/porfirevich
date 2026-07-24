import { useAppStore } from '../store/app';
import { getQueryString } from '../utils/getQueryString';

import type { Story, StoriesResponse } from '@shared/types/Story';

import type { GetStoriesOptions } from '../interfaces';

import { getAuthHeaders } from '@/utils/getAuthHeaders';
import { ensureResponseOk, readJson } from '@/utils/http';

export default {
  async one(id: string) {
    const appModule = useAppStore();
    const token = appModule.token;
    const resp = await fetch('/api/story/' + id, { ...getAuthHeaders(token) });
    return readJson<Story>(resp);
  },

  async all(opt?: GetStoriesOptions) {
    const appModule = useAppStore();
    const resp = await fetch('/api/story/' + (opt ? getQueryString(opt) : ''), {
      ...getAuthHeaders(appModule.token),
    });
    return readJson<StoriesResponse>(resp);
  },

  async like(story: Story) {
    const appModule = useAppStore();
    const token = appModule.token;
    if (token) {
      const response = await fetch('/api/story/' + story.id + '/like', {
        method: 'POST',
        ...getAuthHeaders(token),
      });
      ensureResponseOk(response);
      return true;
    }
    throw new Error('No user set');
  },

  async dislike(story: Story) {
    const appModule = useAppStore();
    const token = appModule.token;
    if (token) {
      const response = await fetch('/api/story/' + story.id + '/dislike', {
        method: 'POST',
        ...getAuthHeaders(token),
      });
      ensureResponseOk(response);
      return true;
    }
    throw new Error('No user set');
  },

  async violation(story: Story) {
    const appModule = useAppStore();
    const token = appModule.token;

    const response = await fetch('/api/story/' + story.id + '/violation', {
      method: 'POST',
      ...getAuthHeaders(token),
    });
    ensureResponseOk(response);
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
      ...getAuthHeaders(opt.token),
    });
    return readJson<Story>(resp);
  },

  async edit(id: string, data: Partial<Story>) {
    const appModule = useAppStore();
    const token = appModule.token;
    const resp = await fetch('/api/story/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...getAuthHeaders(token),
    });
    return readJson<Story>(resp);
  },
};
