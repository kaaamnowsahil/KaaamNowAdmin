import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { getRoutePayments, requestRefund, type RoutePayment } from '@/api/routePayouts';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, rupees, useAdminCall, type TabProps } from '@/features/marketplace/shared';

import { refundable, rupeesToMinor, statusLabel, statusTone } from './routeMath';

const PAYMENT_STATUSES = ['', 'succeeded', 'pending', 'failed', 'expired', 'cancelled'];

function RefundForm({
  payment,
  busy,
  onSubmit,
  onCancel,
}: {
  payment: RoutePayment;
  busy: boolean;
  onSubmit: (amountMinor: number, reason: string, reverse: boolean) => void;
  onCancel: () => void;
}) {
  const { left, withoutReversal } = refundable(payment);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [reverse, setReverse] = useState(false);
  const [formError, setFormError] = useState('');
  const minor = rupeesToMinor(amount);
  const needsReversal = minor !== null && minor > withoutReversal;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (minor === null || minor > left) return setFormError(`Enter an amount up to ${rupees(left)}.`);
    if (reason.trim().length < 5) return setFormError('Give a reason (at least 5 characters).');
    if (needsReversal && !reverse) {
      return setFormError('This amount includes money already sent to Workers. Tick "Reverse Worker transfers" to continue.');
    }
    setFormError('');
    onSubmit(minor, reason, needsReversal && reverse);
  };

  return (
    <form className="hold-form" noValidate onSubmit={submit}>
      <p className="muted-copy">
        Refundable: {rupees(left)}. Without touching Worker transfers: {rupees(withoutReversal)}. The refund waits for
        a second approval in the Refunds tab.
      </p>
      <label>
        Amount (₹)
        <input inputMode="decimal" onChange={(event) => setAmount(event.target.value)} value={amount} />
      </label>
      <label>
        Reason
        <input maxLength={300} onChange={(event) => setReason(event.target.value)} value={reason} />
      </label>
      {needsReversal ? (
        <label className="checkbox-row">
          <input checked={reverse} onChange={(event) => setReverse(event.target.checked)} type="checkbox" />
          Reverse Worker transfers for {rupees((minor ?? 0) - withoutReversal)} (taken back from the Worker's Linked Account)
        </label>
      ) : null}
      {formError ? <span className="field-error">{formError}</span> : null}
      <div className="approve-row">
        <button className="primary-button" disabled={busy} type="submit">Request refund</button>
        <button className="secondary-button" onClick={onCancel} type="button">Cancel</button>
      </div>
    </form>
  );
}

/** Customer payments with Razorpay IDs; admins can start a full or partial refund. */
export function RoutePaymentsTab({ token, onSessionExpired }: TabProps) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [status, setStatus] = useState('succeeded');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<RoutePayment[]>([]);
  const [total, setTotal] = useState(0);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(
    async (offset = 0) => {
      const page = await run(() => getRoutePayments(token, status, query, offset));
      if (!page) return;
      setItems((current) => (offset ? [...current, ...page.items] : page.items));
      setTotal(page.total);
    },
    [query, run, status, token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const refundingPayment = items.find((item) => item.id === refunding);

  const submitRefund = async (payment: RoutePayment, amountMinor: number, reason: string, reverse: boolean) => {
    const refund = await run(() =>
      requestRefund(token, payment.id, { amount_minor: amountMinor, reason, reverse_transfers: reverse }),
    );
    if (!refund) return;
    setRefunding(null);
    setNotice(`Refund of ${rupees(refund.amount_minor)} requested for ${payment.reference}. Approve it in the Refunds tab.`);
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Payments</h2>
          <p>Business payments as Razorpay reports them. Only Razorpay webhooks or API checks mark a payment captured.</p>
        </div>
        <div className="approve-row">
          <input aria-label="Search payments" onChange={(event) => setSearch(event.target.value)} placeholder="Reference or Razorpay ID" value={search} />
          <select aria-label="Payment status" onChange={(event) => setStatus(event.target.value)} value={status}>
            {PAYMENT_STATUSES.map((value) => (
              <option key={value} value={value}>{value ? statusLabel(value) : 'All statuses'}</option>
            ))}
          </select>
        </div>
      </div>
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {refundingPayment ? (
        <RefundForm
          busy={busy}
          key={refundingPayment.id}
          onCancel={() => setRefunding(null)}
          onSubmit={(amountMinor, reason, reverse) => void submitRefund(refundingPayment, amountMinor, reason, reverse)}
          payment={refundingPayment}
        />
      ) : null}
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr><th>PAID</th><th>REFERENCE</th><th>BUSINESS / JOB</th><th>AMOUNT</th><th>REFUNDED</th><th>TO WORKERS</th><th>STATUS</th><th>RAZORPAY</th><th /></tr>
          </thead>
          <tbody>
            {items.map((payment) => (
              <tr key={payment.id}>
                <td>{formatDate(payment.paid_at ?? payment.created_at)}</td>
                <td>{payment.reference}<div className="muted-copy">{statusLabel(payment.invoice_kind)} · {payment.method}</div></td>
                <td>{payment.business_name}<div className="muted-copy">{payment.job_title}</div></td>
                <td>{rupees(payment.amount_minor)}</td>
                <td>{rupees(payment.refunded_minor)}</td>
                <td>{rupees(payment.transferred_minor)}</td>
                <td><StatusBadge tone={statusTone(payment.gateway_status)}>{statusLabel(payment.gateway_status)}</StatusBadge></td>
                <td className="muted-copy">{payment.provider_order_id}<br />{payment.provider_payment_id ?? '—'}</td>
                <td>
                  {payment.status === 'succeeded' && refundable(payment).left > 0 ? (
                    <button className="text-button" disabled={busy} onClick={() => { setNotice(''); setRefunding(payment.id); }} type="button">Refund</button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={9}>{busy ? 'Loading…' : 'No payments.'}</td></tr>}
          </tbody>
        </table>
      </div>
      {items.length < total ? (
        <button className="secondary-button" disabled={busy} onClick={() => void load(items.length)} type="button">Load more</button>
      ) : null}
    </section>
  );
}
