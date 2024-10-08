import { useAppStore } from '../store/app';
import { getAuthHeaders } from '../utils/getAuthHeaders';

import type { Like } from '@shared/types/Like';
import type { User } from '@shared/types/User';

export default {
  async getUser(token: string): Promise<User> {
    const resp = await fetch('/api/user', {
      ...getAuthHeaders(token),
    });
    const json = (await resp.json()) as User;
    return json;
  },

  async edit(id: string, data: Partial<User>) {
    const appModule = useAppStore();
    const token = appModule.token;
    const resp = await fetch('/api/user/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...getAuthHeaders(token),
    });
    const json = (await resp.json()) as User;
    return json;
  },

  async getLikes(token: string): Promise<Like[]> {
    const resp = await fetch('/api/user/likes', {
      ...getAuthHeaders(token),
    });
    const json = (await resp.json()) as Like[];
    return json;
  },
};
