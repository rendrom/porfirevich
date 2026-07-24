import { useAppStore } from '../store/app';
import { getAuthHeaders } from '../utils/getAuthHeaders';
import { readJson } from '../utils/http';

import type { Like } from '@shared/types/Like';
import type { User } from '@shared/types/User';

export default {
  async getUser(token: string): Promise<User> {
    const resp = await fetch('/api/user', {
      ...getAuthHeaders(token),
    });
    return readJson<User>(resp);
  },

  async edit(id: string, data: Partial<User>) {
    const appModule = useAppStore();
    const token = appModule.token;
    const resp = await fetch('/api/user/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...getAuthHeaders(token),
    });
    return readJson<User>(resp);
  },

  async getLikes(token: string): Promise<Like[]> {
    const resp = await fetch('/api/user/likes', {
      ...getAuthHeaders(token),
    });
    return readJson<Like[]>(resp);
  },
};
