import { Story } from '../../srv/entity/Story';

export default {
  async one (id: string) {
    const resp = await fetch('/api/story/' + id);
    const json = (await resp.json()) as Story;
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
    const json = (await resp.json()) as Story;
    return json;
  }
};
