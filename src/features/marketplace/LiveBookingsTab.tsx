import { useCallback, useEffect, useState } from 'react';

import {
  getLiveBooking,
  getLiveBookings,
  getLiveRefunds,
  retryLiveRefund,
  type AdminLiveBooking,
  type AdminLiveBookingDetail,
  type AdminLiveRefund,
} from '@/api/liveWork';

import { TAX_BASE_LABEL } from './livePricingMath';
import { formatDate, rupees, useAdminCall, type TabProps } from './shared';

const STATUSES = ['', 'awaiting_payment', 'searching', 'filled', 'in_progress', 'completed', 'cancelled', 'expired'];
const REFUND_STATUSES = ['', 'pending', 'failed', 'processed'];
const hours = (minutes: number) => `${Number((minutes / 60).toFixed(2))} h`;
const label = (status: string) => status.replace(/_/g, ' ');

function BookingDetail({
  detail,
  busy,
  onRetry,
  onClose,
}: {
  detail: AdminLiveBookingDetail;
  busy: boolean;
  onRetry: (refundId: string) => void;
  onClose: () => void;
}) {
  const { booking, pricing } = detail;
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{booking.job_title}</h2>
          <p>
            {booking.business_name} · {booking.category_name ?? '—'} · {label(booking.shift_status)}
            {booking.worker_name ? ` · Worker: ${booking.worker_name} (${label(detail.assignment_status ?? '')})` : ''}
          </p>
          <p className="muted-copy">{detail.work_address}</p>
        </div>
        <button className="secondary-button" onClick={onClose} type="button">Close</button>
      </div>
      <h3>Price snapshot (settings v{pricing.settings_version})</h3>
      <table className="admin-table">
        <tbody>
          <tr>
            <td>
              {pricing.pricing_mode === 'task'
                ? 'Task (fixed price)'
                : `Base (${rupees(pricing.hourly_rate_minor)}/h × ${hours(pricing.reserved_minutes)})`}
            </td>
            <td>{rupees(pricing.base_amount_minor)}</td>
          </tr>
          <tr><td>Commission ({pricing.commission_pct}%)</td><td>{rupees(pricing.commission_minor)}</td></tr>
          <tr><td>{pricing.tax_label} ({pricing.tax_pct}% of {TAX_BASE_LABEL[pricing.tax_base].toLowerCase()}: {rupees(pricing.taxable_minor)})</td><td>{rupees(pricing.tax_minor)}</td></tr>
          <tr><td className="table-primary-cell">Total</td><td className="table-primary-cell">{rupees(pricing.total_minor)}</td></tr>
          <tr><td>Worker net (base − {rupees(pricing.worker_commission_minor)})</td><td>{rupees(pricing.worker_net_minor)}</td></tr>
          {pricing.pricing_mode === 'task' ? (
            <tr><td>Extensions</td><td>Not available for task pricing</td></tr>
          ) : (
            <tr><td>Extension surcharge</td><td>{pricing.extension_surcharge_pct}% → {rupees(pricing.extension_rate_minor)}/h</td></tr>
          )}
        </tbody>
      </table>

      <h3>Extensions</h3>
      <div className="table-scroll">
        <table className="admin-table">
          <thead><tr><th>REQUESTED</th><th>MINUTES</th><th>STATUS</th><th>RATE</th><th>BASE</th><th>COMMISSION</th><th>TAX</th><th>TOTAL</th></tr></thead>
          <tbody>
            {detail.extensions.map((ext) => (
              <tr key={ext.id}>
                <td>{formatDate(ext.requested_at)}</td><td>{ext.extra_minutes}</td><td>{label(ext.status)}</td>
                <td>{rupees(ext.extension_rate_minor)}/h (+{ext.surcharge_pct}%)</td><td>{rupees(ext.base_amount_minor)}</td>
                <td>{rupees(ext.commission_minor)}</td><td>{rupees(ext.tax_minor)}</td><td>{rupees(ext.total_minor)}</td>
              </tr>
            ))}
            {!detail.extensions.length && <tr><td colSpan={8}>None.</td></tr>}
          </tbody>
        </table>
      </div>

      <h3>Invoices</h3>
      <div className="table-scroll">
        <table className="admin-table">
          <thead><tr><th>KIND</th><th>STATUS</th><th>TOTAL</th><th>DUE</th><th>REFUND DUE</th><th>PAID</th></tr></thead>
          <tbody>
            {detail.invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{label(invoice.invoice_kind)}</td><td>{label(invoice.status)}</td><td>{rupees(invoice.total_minor)}</td>
                <td>{rupees(invoice.amount_due_minor)}</td><td>{rupees(invoice.refund_due_minor)}</td><td>{formatDate(invoice.paid_at)}</td>
              </tr>
            ))}
            {!detail.invoices.length && <tr><td colSpan={6}>None.</td></tr>}
          </tbody>
        </table>
      </div>

      <h3>Cancellations</h3>
      <div className="table-scroll">
        <table className="admin-table">
          <thead><tr><th>WHEN</th><th>PARTY</th><th>EVENT</th><th>FEE</th><th>TO WORKER</th><th>REFUND</th><th>RETAINED</th><th>STRIKE</th></tr></thead>
          <tbody>
            {detail.cancellations.map((c) => (
              <tr key={`${c.party}-${c.created_at}`}>
                <td>{formatDate(c.created_at)}</td><td>{c.party}</td><td>{label(c.event)}</td><td>{rupees(c.fee_minor)}</td>
                <td>{rupees(c.worker_compensation_minor)}</td><td>{rupees(c.business_refund_minor)}</td>
                <td>{rupees(c.business_retained_minor)}</td><td>{c.strike_weight}</td>
              </tr>
            ))}
            {!detail.cancellations.length && <tr><td colSpan={8}>None.</td></tr>}
          </tbody>
        </table>
      </div>

      <h3>Refunds</h3>
      <RefundTable busy={busy} onRetry={onRetry} refunds={detail.refunds} />
    </section>
  );
}

function RefundTable({
  refunds,
  busy,
  onRetry,
  onOpenBooking,
}: {
  refunds: AdminLiveRefund[];
  busy: boolean;
  onRetry: (refundId: string) => void;
  onOpenBooking?: (bookingId: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr><th>CREATED</th><th>BOOKING</th><th>AMOUNT</th><th>REASON</th><th>STATUS</th><th>ATTEMPTS</th><th>PROVIDER REF</th><th /></tr>
        </thead>
        <tbody>
          {refunds.map((refund) => (
            <tr key={refund.id}>
              <td>{formatDate(refund.created_at)}</td>
              <td>
                {onOpenBooking ? (
                  <button className="text-button" onClick={() => onOpenBooking(refund.booking_id)} type="button">{refund.job_title}</button>
                ) : refund.job_title}
              </td>
              <td>{rupees(refund.amount_minor)}</td>
              <td>{label(refund.reason)}</td>
              <td>
                {refund.status}
                {refund.failure_reason ? <span className="muted-copy"> · {refund.failure_reason}</span> : null}
              </td>
              <td>{refund.attempts}</td>
              <td>{refund.provider_refund_id ?? '—'}</td>
              <td>
                {refund.status !== 'processed' && (
                  <button className="text-button" disabled={busy} onClick={() => onRetry(refund.id)} type="button">Retry now</button>
                )}
              </td>
            </tr>
          ))}
          {!refunds.length && <tr><td colSpan={8}>No refunds.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Live Work bookings monitor and refund records. The arrival code and the Worker's precise
 * location are not available to admins.
 */
export function LiveBookingsTab({ token, onSessionExpired }: TabProps) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [status, setStatus] = useState('');
  const [bookings, setBookings] = useState<AdminLiveBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [refundStatus, setRefundStatus] = useState('pending');
  const [refunds, setRefunds] = useState<AdminLiveRefund[]>([]);
  const [detail, setDetail] = useState<AdminLiveBookingDetail | null>(null);

  const loadBookings = useCallback(
    async (offset = 0) => {
      const page = await run(() => getLiveBookings(token, status || undefined, offset));
      if (!page) return;
      setBookings((current) => (offset ? [...current, ...page.items] : page.items));
      setTotal(page.total);
    },
    [run, status, token],
  );

  const loadRefunds = useCallback(async () => {
    const page = await run(() => getLiveRefunds(token, refundStatus || undefined));
    if (page) setRefunds(page.items);
  }, [refundStatus, run, token]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);
  useEffect(() => {
    void loadRefunds();
  }, [loadRefunds]);

  const open = async (bookingId: string) => {
    const next = await run(() => getLiveBooking(token, bookingId));
    if (next) setDetail(next);
  };

  const retry = async (refundId: string) => {
    const updated = await run(() => retryLiveRefund(token, refundId));
    if (!updated) return;
    void loadRefunds();
    if (detail) void open(detail.booking.booking_id);
  };

  return (
    <div className="page-stack">
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {detail && (
        <BookingDetail busy={busy} detail={detail} onClose={() => setDetail(null)} onRetry={(id) => void retry(id)} />
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Live Work bookings</h2>
            <p>{total} booking{total === 1 ? '' : 's'}. Amounts are the server-side price snapshot.</p>
          </div>
          <label>
            Status
            <select onChange={(event) => setStatus(event.target.value)} value={status}>
              {STATUSES.map((value) => <option key={value} value={value}>{value ? label(value) : 'All'}</option>)}
            </select>
          </label>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr><th>CREATED</th><th>WORK</th><th>BUSINESS</th><th>WORKER</th><th>STATUS</th><th>PRICING</th><th>TOTAL</th><th>COMMISSION</th><th>TAX</th><th>REFUNDED</th></tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.booking_id}>
                  <td>{formatDate(booking.created_at)}</td>
                  <td className="table-primary-cell">
                    <button className="text-button" onClick={() => void open(booking.booking_id)} type="button">{booking.job_title}</button>
                  </td>
                  <td>{booking.business_name}</td>
                  <td>{booking.worker_name ?? '—'}</td>
                  <td>{label(booking.shift_status)}{booking.assignment_status ? ` / ${label(booking.assignment_status)}` : ''}</td>
                  <td>{booking.pricing_mode === 'task' ? `Task · ${rupees(booking.task_price_minor ?? 0)}` : hours(booking.reserved_minutes)}</td>
                  <td>{rupees(booking.total_minor)}</td>
                  <td>{rupees(booking.commission_minor)}</td>
                  <td>{rupees(booking.tax_minor)}</td>
                  <td>
                    {rupees(booking.refunded_minor)}
                    {booking.open_refunds ? <span className="muted-copy"> · {booking.open_refunds} open</span> : null}
                  </td>
                </tr>
              ))}
              {!bookings.length && !busy && <tr><td colSpan={10}>No Live Work bookings.</td></tr>}
            </tbody>
          </table>
        </div>
        {bookings.length < total && (
          <button className="text-button" disabled={busy} onClick={() => void loadBookings(bookings.length)} type="button">Load more</button>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Live Work refunds</h2>
            <p>Refunds are sent to the original payment method through the payment gateway and retried automatically.</p>
          </div>
          <label>
            Status
            <select onChange={(event) => setRefundStatus(event.target.value)} value={refundStatus}>
              {REFUND_STATUSES.map((value) => <option key={value} value={value}>{value || 'All'}</option>)}
            </select>
          </label>
        </div>
        <RefundTable busy={busy} onOpenBooking={(id) => void open(id)} onRetry={(id) => void retry(id)} refunds={refunds} />
      </section>
    </div>
  );
}
