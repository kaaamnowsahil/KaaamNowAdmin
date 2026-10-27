import { createRecord, listRecords, updateRecord, type Numeric } from './adminResources';
import { apiRequest } from './client';

export type SearchRadiusFields = {
  /** Live Work: first search ring. */
  live_initial_radius_km: number;
  /** Live Work: ring after the search widens; also used for the "available Workers" map. */
  live_max_radius_km: number;
  /** Scheduled shifts: Workers within this distance get a "new shift near you" alert. */
  scheduled_notify_radius_km: number;
  /** Default radius of the Worker shift feed. */
  feed_radius_km: number;
  /** Workers never see or apply to shifts farther than this. */
  worker_max_shift_distance_km: number;
};

export type EffectiveSearchRadius = SearchRadiusFields & { source: 'admin' | 'default' };

type SearchRadiusRow = { id: string } & Record<keyof SearchRadiusFields, Numeric>;

const RESOURCE = 'search_radius_settings';

/** Distances in effect now (admin row, or the server's configured defaults). */
export function getEffectiveSearchRadius(token: string) {
  return apiRequest<EffectiveSearchRadius>('/api/v1/admin/settings/search-radius', token);
}

/** One settings row: updated in place once it exists; every save is audited. */
export async function saveSearchRadius(token: string, values: SearchRadiusFields, notes: string) {
  const existing = (await listRecords<SearchRadiusRow>(token, RESOURCE, { limit: 1 })).items[0];
  const body = { ...values, notes };
  return existing
    ? updateRecord(token, RESOURCE, existing.id, body)
    : createRecord(token, RESOURCE, body);
}
