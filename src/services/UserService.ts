import {
  StoryResponse,
} from '../interfaces';
import { getAuthHeaders } from '../utils/getAuthHeaders';
import { User } from 'srv/entity/User';

export default {
  async getUser(token: string): Promise<User> {
    const resp = await fetch('/user', {
      ...getAuthHeaders(token)
    }
    );
    const json = (await resp.json()) as User;
    return json;
  }
};
