import { apiRequest } from './client';

/** Postgres NUMERIC columns come back as strings or numbers depending on the driver. */
export type Numeric = number | string;

export type RecordPage<T> = { items: T[]; total: number; limit: number; offset: number };

type ListOptions = {
  limit?: number;
  offset?: number;
  q?: string;
  sort?: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
};

const PAGE_SIZE = 200;
const resourceUrl = (resource: string) => `/api/v1/admin/${encodeURIComponent(resource)}`;

function query({ limit, offset, q, sort, filters }: ListOptions) {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  if (q) params.set('q', q);
  if (sort) params.set('sort', sort);
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value !== undefined) params.set(key, value === null ? 'null' : String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export function listRecords<T>(token: string, resource: string, options: ListOptions = {}) {
  return apiRequest<RecordPage<T>>(`${resourceUrl(resource)}${query(options)}`, token);
}

/** Pages through the generic admin list until `max` rows or the end. */
export async function listAllRecords<T>(
  token: string,
  resource: string,
  options: Omit<ListOptions, 'limit' | 'offset'> = {},
  max = 1_000,
): Promise<T[]> {
  const items: T[] = [];
  for (let offset = 0; offset < max; offset += PAGE_SIZE) {
    const page = await listRecords<T>(token, resource, { ...options, limit: PAGE_SIZE, offset });
    items.push(...page.items);
    if (items.length >= page.total || page.items.length < PAGE_SIZE) break;
  }
  return items.slice(0, max);
}

export function getRecord<T>(token: string, resource: string, id: string) {
  return apiRequest<T>(`${resourceUrl(resource)}/${encodeURIComponent(id)}`, token);
}

export function createRecord<T>(token: string, resource: string, body: object) {
  return apiRequest<T>(resourceUrl(resource), token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateRecord<T = unknown>(
  token: string,
  resource: string,
  id: string,
  body: object,
) {
  return apiRequest<T>(`${resourceUrl(resource)}/${encodeURIComponent(id)}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
