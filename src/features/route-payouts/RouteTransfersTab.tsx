import { useCallback, useEffect, useState } from 'react';

import {
  getRouteTransfers,
  runTransferAction,
  type RouteTransfer,
  type TransferAction,
} from '@/api/routePayouts';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, rupees, useAdminCall, type TabProps } from '@/features/marketplace/shared';

import { statusLabel, statusTone, transferActions } from './routeMath';

const STATUSES = ['', 'pending', 'processing', 'processed', 'failed', 'reversed', 'not_eligible'];

const ACTION_LABEL: Record<TransferAction, string> = {
  approve: 'Approve & send',
  retry: 'Retry',
  sync: 'Check with Razorpay',
  release: 'Release to withdrawals',
};

const CONFIRM: Partial<Record<TransferAction, (t: RouteTransfer) => string>> = {
  approve: (t) => `Send ${rupees(t.amount_minor)} to ${t.worker_name}'s Linked Account (${t.linked_account_id ?? '—'})?`,
  retry: (t) => `Send ${rupees(t.amount_minor)} to ${t.worker_name} again?`,
  release: (t) =>
    `Stop this transfer and give ${rupees(t.amount_minor)} back to ${t.worker_name}'s withdrawable balance? It cannot be sent through Route afterwards.`,
};

/** Worker transfers through Razorpay Route: approve, retry, re-check or release. */
export function RouteTransfersTab({ token, onSessionExpired }: TabProps) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<RouteTransfer[]>([]);
  const [total, setTotal] = useState(0);
  const [notice, setNotice] = useState('');

  const load = useCallback(
    async (offset = 0) => {
      const page = await run(() => getRouteTransfers(token, status, offset));
      if (!page) return;
      setItems((current) => (offset ? [...current, ...page.items] : page.items));
      setTotal(page.total);
    },
    [run, status, token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (transfer: RouteTransfer, action: TransferAction) => {
    const question = CONFIRM[action]?.(transfer);
    if (question && !window.confirm(question)) return;
    setNotice('');
    const updated = await run(() => runTransferAction(token, transfer.id, action));
    if (!updated) return;
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setNotice(
      updated.status === 'processing'
        ? 'Sent to Razorpay. It shows as paid only after Razorpay confirms the transfer.'
        : `Transfer is now ${statusLabel(updated.status)}.`,
    );
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Worker transfers</h2>
          <p>
            Created only after the business's final invoice is settled. Failed transfers keep the money on hold until
            you retry or release them.
          </p>
        </div>
        <select aria-label="Transfer status" onChange={(event) => setStatus(event.target.value)} value={status}>
          {STATUSES.map((value) => (
            <option key={value} value={value}>{value ? statusLabel(value) : 'All statuses'}</option>
          ))}
        </select>
      </div>
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr><th>CREATED</th><th>WORKER</th><th>JOB</th><th>GROSS</th><th>COMMISSION</th><th>NET</th><th>STATUS</th><th>RAZORPAY</th><th /></tr>
          </thead>
          <tbody>
            {items.map((transfer) => (
              <tr key={transfer.id}>
                <td>{formatDate(transfer.created_at)}</td>
                <td>{transfer.worker_name}<div className="muted-copy">{transfer.linked_account_id ?? 'No Linked Account'}</div></td>
                <td>{transfer.job_title}<div className="muted-copy">{transfer.business_name}</div></td>
                <td>{rupees(transfer.gross_minor)}</td>
                <td>{rupees(transfer.commission_minor)}</td>
                <td>
                  {rupees(transfer.amount_minor)}
                  {transfer.reversed_minor ? <div className="muted-copy">Reversed {rupees(transfer.reversed_minor)}</div> : null}
                </td>
                <td>
                  <StatusBadge tone={statusTone(transfer.status)}>{statusLabel(transfer.status)}</StatusBadge>
                  {transfer.failure_reason ? <div className="muted-copy">{transfer.failure_reason}</div> : null}
                  {transfer.processed_at ? <div className="muted-copy">Paid {formatDate(transfer.processed_at)}</div> : null}
                </td>
                <td className="muted-copy">
                  {transfer.razorpay_transfer_id ?? '—'}
                  <br />
                  {transfer.razorpay_payment_id ?? transfer.payment_reference ?? '—'}
                  {transfer.attempts ? <><br />{transfer.attempts} attempt{transfer.attempts === 1 ? '' : 's'}</> : null}
                </td>
                <td>
                  {transferActions(transfer.status).map((action) => (
                    <button className="text-button" disabled={busy} key={action} onClick={() => void act(transfer, action)} type="button">
                      {ACTION_LABEL[action]}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={9}>{busy ? 'Loading…' : 'No transfers.'}</td></tr>}
          </tbody>
        </table>
      </div>
      {items.length < total ? (
        <button className="secondary-button" disabled={busy} onClick={() => void load(items.length)} type="button">Load more</button>
      ) : null}
    </section>
  );
}
