export interface AdminUserSummary {
  id: number;
  username: string;
  email: string | null;
  isBanned: boolean;
  isSuperuser: boolean;
}

export interface AdminUserListResponse {
  items: AdminUserSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
