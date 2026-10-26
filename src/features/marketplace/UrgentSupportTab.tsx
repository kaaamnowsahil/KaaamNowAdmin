import { useCallback, useEffect, useState } from 'react';

import {
  getSupportTickets,
  getUserSummaries,
  updateSupportTicket,
  type AdminUserSummary,
  type SupportTicketRecord,
  type TicketStatus,
} from '@/api/supportTickets';

import { formatDate, useAdminCall, type TabProps } from './shared';

const OPEN_STATUSES: TicketStatus[] = ['open', 'in_progress'];

/** Emergency / urgent tickets first; resolve with a note or jump to the booking ledger. */
export function UrgentSupportTab({
  token,
  onSessionExpired,
  onOpenBooking,
}: TabProps & { onOpenBooking: (assignmentId: string, ticketId: string) => void }) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [users, setUsers] = useState<Map<string, AdminUserSummary>>(new Map());
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const next = await run(async () => {
      const lists = await Promise.all(
        OPEN_STATUSES.map((status) => getSupportTickets(token, { priority: 'urgent', status })),
      );
      const all = lists.flat().sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { all, people: await getUserSummaries(token, all.map((ticket) => ticket.user_id)) };
    });
    if (next) {
      setTickets(next.all);
      setUsers(next.people);
    }
  }, [run, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (ticket: SupportTicketRecord, status: TicketStatus) => {
    const done = await run(() =>
      updateSupportTicket(token, ticket.id, {
        status,
        ...(status === 'closed'
          ? { resolution_note: notes[ticket.id]?.trim() || null, resolved_at: new Date().toISOString() }
          : {}),
      }),
    );
    if (done) void load();
  };

  return (
    <div className="page-stack">
      <div className="deletion-toolbar">
        <span className="muted-copy">{`${tickets.length} open urgent ticket${tickets.length === 1 ? '' : 's'}`}</span>
        <button className="secondary-button" disabled={busy} onClick={() => void load()} type="button">Refresh</button>
      </div>
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {tickets.length === 0 && !busy ? <p className="empty-state">No urgent tickets.</p> : null}
      {tickets.map((ticket) => {
        const user = users.get(ticket.user_id);
        return (
          <section className="panel" key={ticket.id}>
            <div className="panel-heading">
              <div>
                <h2>{`${ticket.topic === 'emergency' ? 'EMERGENCY · ' : ''}${ticket.subject}`}</h2>
                <p>{`${user?.full_name || 'User'} · ${user?.phone ?? ticket.user_id} · ${formatDate(ticket.created_at)} · ${ticket.status}`}</p>
              </div>
              {user?.phone ? <a className="secondary-button" href={`tel:${user.phone}`}>Call</a> : null}
            </div>
            <p>{ticket.message || '—'}</p>
            <div className="hold-form">
              <label>
                Resolution note
                <textarea maxLength={1000} onChange={(event) => setNotes({ ...notes, [ticket.id]: event.target.value })} value={notes[ticket.id] ?? ''} />
              </label>
              <div className="approve-row">
                {ticket.assignment_id && (
                  <button className="text-button" onClick={() => onOpenBooking(ticket.assignment_id ?? '', ticket.id)} type="button">
                    Open booking ledger
                  </button>
                )}
                {ticket.status === 'open' && (
                  <button className="secondary-button" disabled={busy} onClick={() => void update(ticket, 'in_progress')} type="button">
                    Mark in progress
                  </button>
                )}
                <button className="primary-button" disabled={busy} onClick={() => void update(ticket, 'closed')} type="button">
                  Close ticket
                </button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
