import { useCallback, useEffect, useState } from 'react';

import {
  approveRefund,
  getLinkedAccounts,
  getReconciliations,
  getRouteRefunds,
  refreshLinkedAccount,
  rejectRefund,
  resolveReconciliation,
  type LinkedAccount,
  type Page,
  type Reconciliation,
  type RouteRefund,
} from '@/api/routePayouts';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, rupees, useAdminCall, type TabProps } from '@/features/marketplace/shared';

import { statusLabel, statusTone } from './routeMath';

/** One filtered, paged list with "Load more" and in-place row updates. */
function usePagedList<T extends { id: string }>(
  fetchPage: (status: string, offset: number) => Promise<Page<T>>,
  initialStatus: string,
  onSessionExpired: () => void,
) {
  const call = useAdminCall(onSessionExpired);
  const { run } = call;
  const [status, setStatus] = useState(initialStatus);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(
    async (offset = 0) => {
      const page = await run(() => fetchPage(status, offset));
      if (!page) return;
      setItems((current) => (offset ? [...current, ...page.items] : page.items));
      setTotal(page.total);
    },
    [fetchPage, run, status],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const replace = (row: T) => setItems((current) => current.map((item) => (item.id === row.id ? row : item)));
  const more = items.length < total ? () => void load(items.length) : null;
  return { ...call, status, setStatus, items, replace, more };
}

function StatusFilter({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <select aria-label={label} onChange={(event) => onChange(event.target.value)} value={value}>
      {options.map((option) => (
        <option key={option} value={option}>{option ? statusLabel(option) : 'All statuses'}</option>
      ))}
    </select>
  );
}

function LoadMore({ more, busy }: { more: (() => void) | null; busy: boolean }) {
  return more ? <button className="secondary-button" disabled={busy} onClick={more} type="button">Load more</button> : null;
}

/** Refund requests: a second admin step sends them to Razorpay. */
export function RouteRefundsTab({ token, onSessionExpired }: TabProps) {
  const fetchPage = useCallback((status: string, offset: number) => getRouteRefunds(token, status, offset), [token]);
  const list = usePagedList<RouteRefund>(fetchPage, 'requested', onSessionExpired);
  const [notice, setNotice] = useState('');

  const approve = async (refund: RouteRefund) => {
    const reversal = refund.reverse_transfers ? ' Worker transfers are reversed first.' : '';
    if (!window.confirm(`Refund ${rupees(refund.amount_minor)} to ${refund.business_name}?${reversal}`)) return;
    const updated = await list.run(() => approveRefund(token, refund.id));
    if (!updated) return;
    list.replace(updated);
    setNotice(
      updated.status === 'processed'
        ? 'Razorpay confirmed the refund.'
        : updated.status === 'failed'
          ? `Refund failed: ${updated.failure_reason ?? 'see the reconciliation tab.'}`
          : 'Sent to Razorpay. It shows as processed once Razorpay confirms it.',
    );
  };

  const reject = async (refund: RouteRefund) => {
    const reason = window.prompt('Why is this refund rejected? (at least 5 characters)')?.trim();
    if (!reason) return;
    const updated = await list.run(() => rejectRefund(token, refund.id, reason));
    if (updated) list.replace(updated);
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Refunds</h2>
          <p>Requested from the Payments tab. Approving sends the refund to Razorpay (and reverses Worker transfers when chosen).</p>
        </div>
        <StatusFilter label="Refund status" onChange={list.setStatus} options={['', 'requested', 'pending', 'processed', 'failed', 'rejected']} value={list.status} />
      </div>
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}
      {list.error ? <div className="inline-error" role="alert">{list.error}</div> : null}
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr><th>REQUESTED</th><th>PAYMENT</th><th>AMOUNT</th><th>REASON</th><th>REVERSAL</th><th>STATUS</th><th>RAZORPAY</th><th /></tr>
          </thead>
          <tbody>
            {list.items.map((refund) => (
              <tr key={refund.id}>
                <td>{formatDate(refund.created_at)}</td>
                <td>{refund.payment_reference}<div className="muted-copy">{refund.business_name}</div></td>
                <td>{rupees(refund.amount_minor)}</td>
                <td>{refund.reason}</td>
                <td>{refund.reverse_transfers ? `Yes (${rupees(refund.reversed_minor)} reversed)` : 'No'}</td>
                <td>
                  <StatusBadge tone={statusTone(refund.status)}>{statusLabel(refund.status)}</StatusBadge>
                  {refund.failure_reason ? <div className="muted-copy">{refund.failure_reason}</div> : null}
                </td>
                <td className="muted-copy">{refund.provider_refund_id ?? '—'}<br />{refund.provider_payment_id ?? '—'}</td>
                <td>
                  {refund.status === 'requested' ? (
                    <>
                      <button className="text-button" disabled={list.busy} onClick={() => void approve(refund)} type="button">Approve</button>
                      <button className="text-button" disabled={list.busy} onClick={() => void reject(refund)} type="button">Reject</button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
            {!list.items.length && <tr><td colSpan={8}>{list.busy ? 'Loading…' : 'No refunds.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <LoadMore busy={list.busy} more={list.more} />
    </section>
  );
}

const requirementText = (items: Record<string, unknown>[]) =>
  items
    .map((item) => [item.field_reference, item.reason_code, item.resolution_url].filter(Boolean).join(' · '))
    .filter(Boolean)
    .join('; ');

/** Worker Linked Accounts: only Razorpay can activate them; admins can re-check. */
export function RouteAccountsTab({ token, onSessionExpired }: TabProps) {
  const fetchPage = useCallback((status: string, offset: number) => getLinkedAccounts(token, status, offset), [token]);
  const list = usePagedList<LinkedAccount>(fetchPage, '', onSessionExpired);

  const refresh = async (account: LinkedAccount) => {
    const updated = await list.run(() => refreshLinkedAccount(token, account.id));
    if (updated) list.replace(updated);
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Worker Linked Accounts</h2>
          <p>Bank details are kept by Razorpay; we store only the last 4 digits. A Worker gets transfers only once Razorpay activates the account.</p>
        </div>
        <StatusFilter
          label="Activation status"
          onChange={list.setStatus}
          options={['', 'created', 'requested', 'needs_clarification', 'under_review', 'activated', 'suspended', 'failed']}
          value={list.status}
        />
      </div>
      {list.error ? <div className="inline-error" role="alert">{list.error}</div> : null}
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr><th>WORKER</th><th>LEGAL NAME</th><th>BANK</th><th>STATUS</th><th>RAZORPAY</th><th>UPDATED</th><th /></tr>
          </thead>
          <tbody>
            {list.items.map((account) => (
              <tr key={account.id}>
                <td>{account.worker_name}<div className="muted-copy">{account.worker_phone}</div></td>
                <td>{account.legal_name}</td>
                <td>{account.bank_account_last4 ? `•••• ${account.bank_account_last4}` : '—'}<div className="muted-copy">{account.ifsc ?? ''}</div></td>
                <td>
                  <StatusBadge tone={statusTone(account.activation_status)}>{statusLabel(account.activation_status)}</StatusBadge>
                  {account.requirements.length ? <div className="muted-copy">Needs: {requirementText(account.requirements)}</div> : null}
                  {account.last_error ? <div className="muted-copy">{account.last_error}</div> : null}
                </td>
                <td className="muted-copy">{account.razorpay_account_id ?? '—'}<br />{account.product_id ?? '—'}</td>
                <td>{formatDate(account.updated_at)}</td>
                <td>
                  {account.razorpay_account_id ? (
                    <button className="text-button" disabled={list.busy} onClick={() => void refresh(account)} type="button">Check with Razorpay</button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!list.items.length && <tr><td colSpan={7}>{list.busy ? 'Loading…' : 'No Linked Accounts yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <LoadMore busy={list.busy} more={list.more} />
    </section>
  );
}

/** Where our records and Razorpay disagree (late webhooks, failed reversals, timeouts). */
export function RouteReconciliationsTab({ token, onSessionExpired }: TabProps) {
  const fetchPage = useCallback((status: string, offset: number) => getReconciliations(token, status, offset), [token]);
  const list = usePagedList<Reconciliation>(fetchPage, 'open', onSessionExpired);

  const resolve = async (item: Reconciliation) => {
    if (!window.confirm('Mark this as resolved? Do this only after fixing it in Razorpay or our records.')) return;
    const updated = await list.run(() => resolveReconciliation(token, item.id));
    if (updated) list.replace(updated);
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Reconciliation</h2>
          <p>Nothing here is changed automatically. Check the Razorpay Dashboard, fix the cause, then resolve.</p>
        </div>
        <StatusFilter label="Reconciliation status" onChange={list.setStatus} options={['', 'open', 'resolved']} value={list.status} />
      </div>
      {list.error ? <div className="inline-error" role="alert">{list.error}</div> : null}
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr><th>RAISED</th><th>KIND</th><th>OURS</th><th>RAZORPAY</th><th>DETAIL</th><th>STATUS</th><th /></tr>
          </thead>
          <tbody>
            {list.items.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.created_at)}</td>
                <td>{statusLabel(item.kind)}<div className="muted-copy">{item.razorpay_id ?? item.subject_id}</div></td>
                <td>{statusLabel(item.local_status)}</td>
                <td>{statusLabel(item.provider_status)}</td>
                <td>{item.detail}</td>
                <td><StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge></td>
                <td>
                  {item.status === 'open' ? (
                    <button className="text-button" disabled={list.busy} onClick={() => void resolve(item)} type="button">Resolve</button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!list.items.length && <tr><td colSpan={7}>{list.busy ? 'Loading…' : 'Nothing to reconcile.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <LoadMore busy={list.busy} more={list.more} />
    </section>
  );
}
