import { apiRequest } from './client';

export type LookupItem = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateLookupItem = {
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

export type UpdateLookupItem = Partial<Omit<CreateLookupItem, 'is_active'>> & {
  is_active?: boolean;
};

export type LookupCollection = 'work-categories' | 'business-types';

export async function getLookupItems(
  token: string,
  collection: LookupCollection,
): Promise<LookupItem[]> {
  return apiRequest<LookupItem[]>(`/api/v1/${collection}?include_inactive=true`, token);
}

export async function createLookupItem(
  token: string,
  collection: LookupCollection,
  category: CreateLookupItem,
): Promise<LookupItem> {
  return apiRequest<LookupItem>(`/api/v1/${collection}`, token, {
    method: 'POST',
    body: JSON.stringify(category),
  });
}

export async function updateLookupItem(
  token: string,
  collection: LookupCollection,
  id: string,
  changes: UpdateLookupItem,
): Promise<LookupItem> {
  return apiRequest<LookupItem>(
    `/api/v1/${collection}/${encodeURIComponent(id)}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify(changes),
    },
  );
}

export async function deleteLookupItem(token: string, collection: LookupCollection, id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/${collection}/${encodeURIComponent(id)}`, token, {
    method: 'DELETE',
  });
}

export async function restoreLookupItem(token: string, collection: LookupCollection, id: string): Promise<LookupItem> {
  return apiRequest<LookupItem>(`/api/v1/${collection}/${encodeURIComponent(id)}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: true }),
  });
}
