import { getAuthHeaders } from '@/utils/getAuthHeaders';
import { readJson } from '@/utils/http';

import type {
  AdminUserListResponse,
  AdminUserSummary,
} from '@shared/types/AdminUser';

interface AdminUserListOptions {
  page: number;
  pageSize: number;
  search?: string;
  role?: 'all' | 'admin' | 'user';
  status?: 'all' | 'active' | 'banned';
}

export default {
  async list(
    token: string,
    options: AdminUserListOptions,
  ): Promise<AdminUserListResponse> {
    const query = new URLSearchParams({
      page: String(options.page),
      pageSize: String(options.pageSize),
    });
    if (options.search) query.set('search', options.search);
    if (options.role && options.role !== 'all') {
      query.set('role', options.role);
    }
    if (options.status && options.status !== 'all') {
      query.set('status', options.status);
    }

    const response = await fetch(`/api/user/admin?${query}`, {
      ...getAuthHeaders(token),
    });
    return readJson<AdminUserListResponse>(response);
  },

  async setBanStatus(
    token: string,
    id: number,
    isBanned: boolean,
  ): Promise<AdminUserSummary> {
    const response = await fetch(`/api/user/admin/${id}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ isBanned }),
      ...getAuthHeaders(token),
    });
    return readJson<AdminUserSummary>(response);
  },
};
