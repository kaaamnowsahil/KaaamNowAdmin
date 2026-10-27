import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { saveSearchRadius } from '@/api/searchRadius';

import { validateSearchRadius } from './SearchRadiusTab';

const valid = {
  live_initial_radius_km: '3',
  live_max_radius_km: '7.5',
  scheduled_notify_radius_km: '30',
  feed_radius_km: '15',
  worker_max_shift_distance_km: '30',
  notes: 'Wider search in Chennai',
};

describe('validateSearchRadius', () => {
  it('accepts sensible distances', () => {
    expect(validateSearchRadius(valid)).toEqual({});
  });

  it('rejects out-of-range, badly formatted and out-of-order distances', () => {
    const errors = validateSearchRadius({
      ...valid,
      live_initial_radius_km: '10',
      live_max_radius_km: '5',
      scheduled_notify_radius_km: '150',
      feed_radius_km: '40',
      worker_max_shift_distance_km: '2.25',
      notes: ' ',
    });
    expect(Object.keys(errors).sort()).toEqual([
      'live_max_radius_km',
      'notes',
      'scheduled_notify_radius_km',
      'worker_max_shift_distance_km',
    ]);
  });

  it('keeps the feed inside the maximum shift distance', () => {
    expect(validateSearchRadius({ ...valid, feed_radius_km: '35' }).feed_radius_km).toBeDefined();
  });
});

describe('saveSearchRadius', () => {
  let calls: { url: URL; init: RequestInit }[];
  let existing: unknown[];

  beforeEach(() => {
    calls = [];
    existing = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string, init: RequestInit) => {
        const url = new URL(input);
        calls.push({ url, init });
        const body = init.method ? {} : { items: existing, total: existing.length, limit: 1, offset: 0 };
        return new Response(JSON.stringify(body), { status: 200 });
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  const values = { live_initial_radius_km: 3, live_max_radius_km: 8, scheduled_notify_radius_km: 30, feed_radius_km: 15, worker_max_shift_distance_km: 30 };

  it('creates the settings row the first time', async () => {
    await saveSearchRadius('t', values, 'first');
    expect(calls[1]?.init.method).toBe('POST');
    expect(calls[1]?.url.pathname).toBe('/api/v1/admin/search_radius_settings');
    expect(JSON.parse(String(calls[1]?.init.body))).toEqual({ ...values, notes: 'first' });
  });

  it('updates the existing row afterwards', async () => {
    existing = [{ id: 'row-1' }];
    await saveSearchRadius('t', values, 'again');
    expect(calls[1]?.init.method).toBe('PATCH');
    expect(calls[1]?.url.pathname).toBe('/api/v1/admin/search_radius_settings/row-1');
  });
});
