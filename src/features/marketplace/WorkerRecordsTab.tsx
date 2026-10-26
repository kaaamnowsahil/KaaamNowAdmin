import { useState } from 'react';

import { applyBookingOverride } from '@/api/bookings';
import {
  getLatestAssignmentId,
  getWorkerLedger,
  getWorkerRestrictions,
  getWorkerStrikes,
  type EarningLedgerEntry,
  type WorkerRestrictions,
  type WorkerStrike,
} from '@/api/workerRecords';

import { formatDate, rupees, useAdminCall, type TabProps } from './shared';

type Records = {
  restrictions: WorkerRestrictions;
  strikes: WorkerStrike[];
  ledger: EarningLedgerEntry[];
};

const isLive = (strike: WorkerStrike) =>
  !strike.voided_at && new Date(strike.expires_at).getTime() > Date.now();

/** Dues, strikes and bans for one worker profile, with void / unban overrides. */
export function WorkerRecordsTab({ token, onSessionExpired }: TabProps) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [workerId, setWorkerId] = useState('');
  const [records, setRecords] = useState<Records | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setNotice('');
    const id = workerId.trim();
    const next = await run(async () => {
      const [restrictions, strikes, ledger] = await Promise.all([
        getWorkerRestrictions(token, id),
        getWorkerStrikes(token, id),
        getWorkerLedger(token, id),
      ]);
      return { restrictions, strikes, ledger };
    });
    if (next) setRecords(next);
  };

  const override = async (action: 'void_strike' | 'unban_worker', assignmentId: string | null) => {
    const done = await run(async () => {
      const target = assignmentId ?? (await getLatestAssignmentId(token, workerId.trim()));
      if (!target) throw new Error('This worker has no bookings to attach the override to.');
      return applyBookingOverride(token, target, { action, reason: reason.trim() });
    });
    if (done) {
      setNotice(action === 'void_strike' ? 'Strike voided.' : 'Worker unbanned.');
      void load();
    }
  };

  const balance = records?.ledger.reduce((sum, entry) => sum + entry.amount_minor, 0) ?? 0;
  const liveStrikes = records?.strikes.filter(isLive) ?? [];
  const strikeTotal = liveStrikes.reduce((sum, strike) => sum + Number(strike.weight), 0);
  const restricted = Boolean(records?.restrictions.banned_at || records?.restrictions.feed_limited_until);
  const reasonOk = reason.trim().length >= 5;

  return (
    <div className="page-stack">
      <form className="deletion-toolbar" onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <label>
          Worker profile ID
          <input onChange={(event) => setWorkerId(event.target.value)} placeholder="uuid" value={workerId} />
        </label>
        <button className="secondary-button" disabled={busy || !workerId.trim()} type="submit">Load worker</button>
      </form>
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}

      {records && (
        <>
          <section className="panel">
            <div className="deletion-facts">
              <div><small>Wallet balance</small><strong>{rupees(balance)}</strong></div>
              <div><small>Dues owed</small><strong>{balance < 0 ? rupees(-balance) : '—'}</strong></div>
              <div><small>Active strikes</small><strong>{strikeTotal}</strong></div>
              <div><small>Fewer shifts until</small><strong>{formatDate(records.restrictions.feed_limited_until)}</strong></div>
              <div><small>Paused since</small><strong>{formatDate(records.restrictions.banned_at)}</strong></div>
            </div>
            <label className="hold-form">
              Reason for any override <span className="field-hint">(5–500 characters)</span>
              <textarea maxLength={500} onChange={(event) => setReason(event.target.value)} value={reason} />
            </label>
            {restricted && (
              <button className="primary-button" disabled={busy || !reasonOk} onClick={() => void override('unban_worker', null)} type="button">
                Unban / remove limit
              </button>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading"><div><h2>Strikes</h2></div></div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead><tr><th>WEIGHT</th><th>REASON</th><th>CREATED</th><th>EXPIRES</th><th>STATUS</th><th /></tr></thead>
                <tbody>
                  {records.strikes.map((strike) => (
                    <tr key={strike.id}>
                      <td>{Number(strike.weight)}</td>
                      <td>{strike.reason}</td>
                      <td>{formatDate(strike.created_at)}</td>
                      <td>{formatDate(strike.expires_at)}</td>
                      <td>{strike.voided_at ? `Voided: ${strike.void_reason ?? ''}` : isLive(strike) ? 'Active' : 'Expired'}</td>
                      <td>
                        {isLive(strike) && strike.assignment_id && (
                          <button className="text-button danger-text" disabled={busy || !reasonOk} onClick={() => void override('void_strike', strike.assignment_id)} type="button">
                            Void
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {records.strikes.length === 0 ? <p className="empty-state">No strikes.</p> : null}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading"><div><h2>Wallet ledger</h2><p>Fee waivers are applied per booking from the booking ledger tab.</p></div></div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead><tr><th>TYPE</th><th>DESCRIPTION</th><th>AMOUNT</th><th>BOOKING</th><th>DATE</th></tr></thead>
                <tbody>
                  {records.ledger.slice(0, 200).map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.entry_type}</td>
                      <td>{entry.description || '—'}</td>
                      <td>{rupees(entry.amount_minor)}</td>
                      <td>{entry.assignment_id ?? '—'}</td>
                      <td>{formatDate(entry.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
