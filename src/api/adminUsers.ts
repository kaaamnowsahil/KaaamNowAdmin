import { apiRequest } from './client';

type AdminUserRecord = {
  id: string;
  is_active: boolean;
};

type AdminUserPage = {
  items: AdminUserRecord[];
  total: number;
};

export async function getAdminUserStatus(token: string): Promise<Map<string, boolean>> {
  const statuses = new Map<string, boolean>();
  const limit = 100;
  let offset = 0;

  while (true) {
    const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const page = await apiRequest<AdminUserPage>(
      `/api/v1/admin/users?${query.toString()}`,
      token,
    );
    for (const user of page.items) statuses.set(user.id, user.is_active);
    offset += page.items.length;
    if (page.items.length === 0 || offset >= page.total) return statuses;
  }
}

export function setAdminUserActive(
  token: string,
  userId: string,
  isActive: boolean,
): Promise<AdminUserRecord> {
  return apiRequest<AdminUserRecord>(
    `/api/v1/admin/users/${encodeURIComponent(userId)}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    },
  );
}
