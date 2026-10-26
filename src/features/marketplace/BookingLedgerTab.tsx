import { type FormEvent, useEffect, useState } from 'react';

import {
  applyBookingOverride,
  getBookingLedger,
  OVERRIDE_ACTION_LABELS,
  type BookingLedger,
  type LedgerLine,
  type OverrideAction,
} from '@/api/bookings';

import { formatDate, rupees, useAdminCall, type TabProps } from './shared';

const SECTIONS: { key: keyof Pick<BookingLedger, 'invoices' | 'charges' | 'worker_entries' | 'strikes' | 'vouchers'>; title: string }[] = [
  { key: 'invoices', title: 'Business invoices' },
  { key: 'charges', title: 'Cancellation charges' },
  { key: 'worker_entries', title: 'Worker wallet' },
  { key: 'strikes', title: 'Strikes' },
  { key: 'vouchers', title: 'Vouchers' },
];

function Lines({ lines }: { lines: LedgerLine[] }) {
  if (!lines.length) return <p className="muted-copy">None.</p>;
  return (
    <table className="admin-table">
      <tbody>
        {lines.map((line, index) => (
          <tr key={`${line.kind}-${line.created_at}-${index}`}>
            <td>{line.kind}</td>
            <td>{line.description || '—'}</td>
            <td>{rupees(line.amount_minor)}</td>
            <td>{formatDate(line.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Look up one booking by assignment id, see every money / strike line and apply overrides. */
export function BookingLedgerTab({
  token,
  onSessionExpired,
  initialAssignmentId = '',
  supportTicketId,
}: TabProps & { initialAssignmentId?: string; supportTicketId?: string }) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [assignmentId, setAssignmentId] = useState(initialAssignmentId);
  const [ledger, setLedger] = useState<BookingLedger | null>(null);
  const [action, setAction] = useState<OverrideAction>('waive_worker_fee');
  const [reason, setReason] = useState('');
  const [refund, setRefund] = useState('');
  const [notice, setNotice] = useState('');

  const load = async (id = assignmentId) => {
    setNotice('');
    const next = await run(() => getBookingLedger(token, id.trim()));
    if (next) setLedger(next);
  };

  useEffect(() => {
    if (initialAssignmentId) void load(initialAssignmentId);
  }, []);

  const override = async (event: FormEvent) => {
    event.preventDefault();
    if (!ledger) return;
    const done = await run(() =>
      applyBookingOverride(token, ledger.assignment_id, {
        action,
        reason: reason.trim(),
        ...(action === 'refund_business' ? { amount_minor: Math.round(Number(refund) * 100) } : {}),
        ...(supportTicketId ? { support_ticket_id: supportTicketId } : {}),
      }),
    );
    if (done) {
      setReason('');
      setRefund('');
      setNotice(`${OVERRIDE_ACTION_LABELS[action]} applied.`);
      void load(ledger.assignment_id);
    }
  };

  return (
    <div className="page-stack">
      <form className="deletion-toolbar" onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <label>
          Booking (assignment) ID
          <input onChange={(event) => setAssignmentId(event.target.value)} placeholder="uuid" value={assignmentId} />
        </label>
        <button className="secondary-button" disabled={busy || !assignmentId.trim()} type="submit">Load ledger</button>
      </form>
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}

      {ledger && (
        <>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{ledger.job_title}</h2>
                <p>{`${ledger.business_name} · ${ledger.worker_name ?? 'Worker'} · ${ledger.status}`}</p>
              </div>
            </div>
            {SECTIONS.map((section) => (
              <div className="review-section" key={section.key}>
                <h3>{section.title}</h3>
                <div className="table-scroll"><Lines lines={ledger[section.key]} /></div>
              </div>
            ))}
            <div className="review-section">
              <h3>Overrides</h3>
              {ledger.overrides.length ? ledger.overrides.map((item) => (
                <p className="muted-copy" key={item.id}>
                  {`${OVERRIDE_ACTION_LABELS[item.action]} · ${rupees(item.amount_minor)} · ${item.reason} · ${formatDate(item.created_at)}`}
                </p>
              )) : <p className="muted-copy">None.</p>}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading"><div><h2>Apply override</h2><p>Every override is logged with your reason.</p></div></div>
            <form className="hold-form" onSubmit={(event) => void override(event)}>
              <label>
                Action
                <select onChange={(event) => setAction(event.target.value as OverrideAction)} value={action}>
                  {Object.entries(OVERRIDE_ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              {action === 'refund_business' && (
                <label>Refund amount (₹)<input min={1} onChange={(event) => setRefund(event.target.value)} required type="number" value={refund} /></label>
              )}
              <label>Reason<textarea maxLength={500} minLength={5} onChange={(event) => setReason(event.target.value)} required value={reason} /></label>
              <button className="primary-button" disabled={busy || reason.trim().length < 5} type="submit">Apply</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
