import { CircleDollarSign, Download, Percent, RefreshCw, TriangleAlert, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  downloadRouteCsv,
  getRouteConfig,
  getRouteOverview,
  type ExportKind,
  type RouteConfig,
  type RouteOverview,
} from '@/api/routePayouts';
import { MetricCard } from '@/components/MetricCard';
import { rupees, useAdminCall, type TabProps } from '@/features/marketplace/shared';

import { statusLabel } from './routeMath';

const EXPORTS: { kind: ExportKind; label: string }[] = [
  { kind: 'transfers', label: 'Transfers' },
  { kind: 'payments', label: 'Payments' },
  { kind: 'refunds', label: 'Refunds' },
];
const TRANSFER_ORDER = ['pending', 'processing', 'processed', 'failed', 'reversed', 'not_eligible'];

function ConfigBanner({ config }: { config: RouteConfig }) {
  const missing = [
    !config.route_enabled && 'RAZORPAY_ROUTE_ENABLED is off: no Worker transfers are created; earnings stay withdrawable.',
    config.route_enabled && !config.linked_account_category_set && 'Linked Account category / subcategory is not configured.',
    !config.webhook_secret_set && 'RAZORPAY_WEBHOOK_SECRET is not set: Razorpay webhooks are rejected.',
  ].filter(Boolean) as string[];
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Razorpay setup</h2>
          <p>
            Mode: <strong>{config.mode.toUpperCase()}</strong> · Payments: {config.payment_provider} · Withdrawals:{' '}
            {config.payout_provider} · Route: <strong>{config.route_enabled ? 'ON' : 'OFF'}</strong> · RazorpayX:{' '}
            <strong>{config.razorpayx_payout_enabled ? 'ON' : 'OFF'}</strong> · Transfers{' '}
            {config.require_admin_approval ? 'wait for admin approval' : 'are sent automatically'}
          </p>
        </div>
      </div>
      {missing.map((text) => (
        <div className="inline-notice" key={text} role="status">{text}</div>
      ))}
    </section>
  );
}

/** Razorpay configuration, money totals and CSV exports. */
export function RouteOverviewTab({ token, onSessionExpired }: TabProps) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [config, setConfig] = useState<RouteConfig | null>(null);
  const [overview, setOverview] = useState<RouteOverview | null>(null);

  const load = useCallback(async () => {
    const result = await run(() => Promise.all([getRouteConfig(token), getRouteOverview(token)]));
    if (!result) return;
    setConfig(result[0]);
    setOverview(result[1]);
  }, [run, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = (kind: ExportKind) => void run(() => downloadRouteCsv(token, kind));

  return (
    <div className="page-stack">
      {config ? <ConfigBanner config={config} /> : null}
      {overview ? (
        <section className="metric-grid">
          <MetricCard label="Captured payments" value={rupees(overview.captured_minor)} note="{{count}} payments confirmed by Razorpay" noteValues={{ count: overview.captured_count }} icon={CircleDollarSign} iconTone="tone-green" />
          <MetricCard label="Worker commission" value={rupees(overview.worker_commission_minor)} note="of {{gross}} Worker gross earnings" noteValues={{ gross: rupees(overview.worker_gross_minor) }} icon={Percent} iconTone="tone-purple" />
          <MetricCard label="Refunded" value={rupees(overview.refunded_minor)} note="{{count}} refunds awaiting approval" noteValues={{ count: overview.refunds_awaiting }} icon={Undo2} iconTone="tone-orange" />
          <MetricCard label="Open reconciliations" value={String(overview.open_reconciliations)} note="Our records and Razorpay disagree" icon={TriangleAlert} iconTone="tone-blue" />
        </section>
      ) : null}
      {overview ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Worker transfers</h2>
              <p>Paid means Razorpay confirmed the transfer, not just that the request was accepted.</p>
            </div>
            <button className="secondary-button" disabled={busy} onClick={() => void load()} type="button">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
          <table className="admin-table">
            <thead><tr><th>STATUS</th><th>COUNT</th><th>AMOUNT</th></tr></thead>
            <tbody>
              {TRANSFER_ORDER.map((status) => (
                <tr key={status}>
                  <td>{statusLabel(status)}</td>
                  <td>{overview.transfers[status]?.count ?? 0}</td>
                  <td>{rupees(overview.transfers[status]?.amount_minor ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Export</h2>
            <p>CSV (up to 5,000 rows each) for accounting and reconciliation.</p>
          </div>
        </div>
        <div className="approve-row">
          {EXPORTS.map(({ kind, label }) => (
            <button className="secondary-button" disabled={busy} key={kind} onClick={() => exportCsv(kind)} type="button">
              <Download size={15} /> {label} CSV
            </button>
          ))}
        </div>
      </section>
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
    </div>
  );
}
