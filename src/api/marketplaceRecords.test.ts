import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMetricsOverview, countFor } from './metrics';
import { listRecentRecords, loadMarketplaceRecords } from './marketplaceRecords';

type Call = { url: URL; init: RequestInit };

let calls: Call[];
let pages: Record<string, { items: unknown[]; total: number }>;

beforeEach(() => {
  calls = [];
  pages = {};
  vi.stubGlobal('fetch', vi.fn(async (input: string, init: RequestInit) => {
    const url = new URL(input);
    calls.push({ url, init });
    const resource = url.pathname.split('/').pop() ?? '';
    if (url.pathname.endsWith('/metrics/overview')) {
      return new Response(JSON.stringify({ shifts_by_status: [{ key: 'open', count: 4 }] }), { status: 200 });
    }
    if (url.pathname.includes('/admin/users/')) {
      const id = url.pathname.split('/').pop();
      if (id === 'missing') return new Response(JSON.stringify({ message: 'nope' }), { status: 404 });
      return new Response(JSON.stringify({ id, full_name: 'User', phone: '+91' }), { status: 200 });
    }
    const page = pages[resource] ?? { items: [], total: 0 };
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 200);
    return new Response(
      JSON.stringify({ items: page.items.slice(offset, offset + limit), total: page.total, limit, offset }),
      { status: 200 },
    );
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listRecentRecords', () => {
  it('pages through the authenticated generic admin list and reports the server total', async () => {
    pages.shifts = { items: Array.from({ length: 250 }, (_, i) => ({ id: String(i) })), total: 250 };
    const result = await listRecentRecords<{ id: string }>('tok', 'shifts', '-created_at');
    expect(result.items).toHaveLength(250);
    expect(result.total).toBe(250);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.url.searchParams.get('sort')).toBe('-created_at');
    expect(calls[1]?.url.searchParams.get('offset')).toBe('200');
    expect((calls[0]?.init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('caps loaded rows but keeps the real total', async () => {
    pages.shifts = { items: Array.from({ length: 400 }, (_, i) => ({ id: String(i) })), total: 9_000 };
    const result = await listRecentRecords('tok', 'shifts', '-created_at', 300);
    expect(result.items).toHaveLength(300);
    expect(result.total).toBe(9_000);
  });
});

describe('loadMarketplaceRecords', () => {
  it('loads every table from the backend and resolves ticket users', async () => {
    pages.shifts = { items: [{ id: 's1' }], total: 1 };
    pages.payments = { items: [{ id: 'p1' }], total: 7 };
    pages.withdrawals = { items: [], total: 0 };
    pages.support_tickets = {
      items: [{ id: 't1', user_id: 'u1' }, { id: 't2', user_id: 'missing' }],
      total: 2,
    };
    const { records, totals } = await loadMarketplaceRecords('tok');
    expect(records.shifts).toEqual([{ id: 's1' }]);
    expect(totals).toEqual({ shifts: 1, payments: 7, withdrawals: 0, supportTickets: 2 });
    expect(records.users.get('u1')?.full_name).toBe('User');
    expect(records.users.has('missing')).toBe(false);
    const resources = new Set(calls.map(call => call.url.pathname.split('/')[4]));
    expect(resources).toEqual(
      new Set([
        'shifts',
        'shift_assignments',
        'payments',
        'shift_invoices',
        'withdrawals',
        'payout_accounts',
        'support_tickets',
        'users',
      ]),
    );
  });

  it('propagates backend failures instead of returning sample data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 })));
    await expect(loadMarketplaceRecords('tok')).rejects.toMatchObject({ status: 403 });
  });
});

describe('metrics', () => {
  it('reads the server overview', async () => {
    const overview = await getMetricsOverview('tok');
    expect(calls[0]?.url.pathname).toBe('/api/v1/admin/metrics/overview');
    expect(countFor(overview.shifts_by_status, 'open')).toBe(4);
    expect(countFor(overview.shifts_by_status, 'completed')).toBe(0);
  });
});
