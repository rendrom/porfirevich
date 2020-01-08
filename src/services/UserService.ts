import { getAuthHeaders } from '../utils/getAuthHeaders';
import { User } from '../../srv/entity/User';
import { Like } from '../../srv/entity/Like';

export default {
  async getUser(token: string): Promise<User> {
    const resp = await fetch('/user', {
      ...getAuthHeaders(token)
    });
    const json = (await resp.json()) as User;
    return json;
  },
  async getLikes(token: string): Promise<Like[]> {
    const resp = await fetch('/user/likes', {
      ...getAuthHeaders(token)
    });
    const json = (await resp.json()) as Like[];
    return json;
  }
};
