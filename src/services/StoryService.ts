import { StoriesResponse, StoryResponse, GetStoriesOptions } from '../interfaces';
import { getQueryString } from '../utils/getQueryString';
import { Story } from '../../srv/entity/Story';

export default {
  async one (id: string) {
    const resp = await fetch('/api/story/' + id);
    const json = (await resp.json()) as StoryResponse;
    return json;
  },

  async all (opt?: GetStoriesOptions) {
    const resp = await fetch('/api/story/' + (opt ? getQueryString(opt) : ''));
    const json = (await resp.json()) as StoriesResponse;
    return json;
  },

  async create (data: { content: string; description?: string }) {
    const resp = await fetch('/api/story', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    );
    const json = (await resp.json()) as StoryResponse;
    return json;
  },

  async edit (id: string, data: Partial<Story>) {
    const resp = await fetch('/api/story/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    );
    const json = (await resp.json()) as StoryResponse;
    return json;
  }
};
