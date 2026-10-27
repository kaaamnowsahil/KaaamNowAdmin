import { afterEach, describe, expect, it, vi } from 'vitest';

import { setSupportTicketStatus } from './supportTickets';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setSupportTicketStatus', () => {
  it('posts only the status and note; the server stamps time and admin', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: 't 1', status: 'closed', resolved_at: '2026-10-27T10:00:00Z' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const saved = await setSupportTicketStatus('token', 't 1', { status: 'closed', resolution_note: 'Refunded' });

    expect(saved.status).toBe('closed');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://api.test/api/v1/admin/support-tickets/t%201/status');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ status: 'closed', resolution_note: 'Refunded' });
  });

  it('surfaces the server error instead of pretending the ticket closed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ code: 'support_ticket_closed', message: 'This support ticket is already closed.' }), { status: 409 }),
    ));

    await expect(setSupportTicketStatus('token', 't1', { status: 'in_progress' })).rejects.toThrow(/already closed/);
  });
});
