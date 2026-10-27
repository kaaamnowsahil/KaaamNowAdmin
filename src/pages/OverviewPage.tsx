import { formatText } from '@/utils/text';
import {
  ArrowDownLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  CircleHelp,
  Clock3,
  Download,
  Plus,
  UsersRound,
} from 'lucide-react';

import { countFor, type AdminMetricsOverview } from '@/api/metrics';
import { MetricCard } from '@/components/MetricCard';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import type { AdminShift, Payment, Payout, SupportTicket, Worker } from '@/types';
import { downloadCsv } from '@/utils/csv';
import { formatCompactRupees, formatCount, formatMinorRupees } from '@/utils/format';
import { recentActivity, shiftsNeedingWorkers } from './overviewLogic';

type OverviewPageProps = {
  workers: Worker[];
  shifts: AdminShift[];
  payments: Payment[];
  payouts: Payout[];
  supportTickets: SupportTicket[];
  pendingApprovals: number;
  metrics: AdminMetricsOverview | null;
  metricsError: string;
  onRetryMetrics: () => void;
  onOpenSection: (section: 'workers' | 'businesses' | 'shifts' | 'payments' | 'payouts' | 'approvals' | 'support') => void;
};

const UNAVAILABLE = '—';

const greeting = (hour: number) =>
  hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

const titleCase = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());

const formatWhen = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

export function OverviewPage({
  workers,
  shifts,
  payments,
  payouts,
  supportTickets,
  pendingApprovals,
  metrics,
  metricsError,
  onRetryMetrics,
  onOpenSection,
}: OverviewPageProps) {
  const verifiedBusinesses = metrics ? countFor(metrics.businesses_by_verification, 'verified') : null;
  const understaffed = shiftsNeedingWorkers(shifts).length;
  const activity = recentActivity({ shifts, payments, payouts, supportTickets }, 5);
  const shiftStatuses = [...(metrics?.shifts_by_status ?? [])].sort((a, b) => b.count - a.count);
  const largestStatus = Math.max(1, ...shiftStatuses.map(item => item.count));

  const exportReport = () => {
    if (!metrics) return;
    downloadCsv(
      'kaaamnow-marketplace-overview',
      ['Metric', 'Value'],
      [
        ['Total users', metrics.users_total],
        ['Active users', metrics.users_active],
        ['Total workers', metrics.workers_total],
        ['Total businesses', metrics.businesses_total],
        ['Verified businesses', verifiedBusinesses ?? 0],
        ['Total shifts', metrics.shifts_total],
        ...metrics.shifts_by_status.map(item => [`Shifts ${item.key}`, item.count] as [string, number]),
        ['Succeeded payments (INR)', metrics.payments_succeeded_minor / 100],
        ['Paid invoices (INR)', metrics.invoiced_paid_minor / 100],
        ['Platform fees on paid invoices (INR)', metrics.platform_fees_minor / 100],
        ['Withdrawals in flight', metrics.pending_withdrawals],
        ['Withdrawals in flight (INR)', metrics.pending_withdrawals_minor / 100],
        ['Paid out to workers (INR)', metrics.total_paid_out_minor / 100],
        ['Open support tickets', metrics.open_support_tickets],
        ['Pending verifications', pendingApprovals],
      ],
    );
  };

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase()}</p>
          <h1>{greeting(new Date().getHours())}</h1>
          <p className="page-description">{'Here’s what’s happening across your marketplace.'}</p>
        </div>
        <div className="welcome-actions">
          <button className="button button-secondary" onClick={exportReport} disabled={!metrics}>
            <Download size={16} />
            {'Export report'}
          </button>
          <button className="button button-primary" onClick={() => onOpenSection('approvals')}>
            <Plus size={17} />
            {'Review queue'}
            <span className="button-count">{pendingApprovals}</span>
          </button>
        </div>
      </section>

      {metricsError ? (
        <div className="inline-error" role="alert">
          {metricsError}{' '}
          <button className="text-action" onClick={onRetryMetrics}>{'Retry'}</button>
        </div>
      ) : null}

      <section className="metric-grid" aria-label={'Marketplace metrics'}>
        <MetricCard label="Total workers" value={metrics ? formatCount(metrics.workers_total) : UNAVAILABLE} note="Worker profiles in the database" icon={UsersRound} iconTone="tone-purple" />
        <MetricCard label="Verified businesses" value={verifiedBusinesses === null ? UNAVAILABLE : formatCount(verifiedBusinesses)} note="of {{count}} business profiles" noteValues={{ count: metrics?.businesses_total ?? UNAVAILABLE }} icon={Building2} iconTone="tone-blue" />
        <MetricCard label="Shifts in marketplace" value={metrics ? formatCount(metrics.shifts_total) : UNAVAILABLE} note="{{count}} open shifts need more workers" noteValues={{ count: understaffed }} icon={BriefcaseBusiness} iconTone="tone-orange" />
        <MetricCard label="Succeeded payments" value={metrics ? formatCompactRupees(metrics.payments_succeeded_minor / 100) : UNAVAILABLE} note="Provider-confirmed business charges" icon={CircleDollarSign} iconTone="tone-green" />
      </section>

      <section className="overview-main-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>{'Shifts by status'}</h2>
              <p>{'Current status of every shift in the database'}</p>
            </div>
          </div>
          {shiftStatuses.length ? (
            <div className="compact-list">
              {shiftStatuses.map(item => (
                <div className="compact-row" key={item.key}>
                  <span className="compact-primary">
                    <strong>{titleCase(item.key)}</strong>
                    <small>
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'block',
                          height: 6,
                          borderRadius: 3,
                          background: '#8B5CF6',
                          width: `${Math.max(2, (item.count / largestStatus) * 100)}%`,
                        }}
                      />
                    </small>
                  </span>
                  <span className="compact-rating">{formatCount(item.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">{metrics ? 'No shifts have been posted yet.' : 'Shift metrics are unavailable.'}</p>
          )}
          <div className="chart-legend">
            {metrics ? (
              <span>{formatText('Platform fees on paid invoices: {{fees}} · Paid out to workers: {{paid}}', {
                fees: formatMinorRupees(metrics.platform_fees_minor),
                paid: formatMinorRupees(metrics.total_paid_out_minor),
              })}</span>
            ) : <span />}
            <button className="text-action" onClick={() => onOpenSection('shifts')}>{'View shifts'} <ArrowRight size={14} /></button>
          </div>
        </article>

        <article className="panel approvals-panel">
          <div className="panel-heading">
            <div>
              <h2>{'Needs your attention'}</h2>
              <p>{'Keep the marketplace moving'}</p>
            </div>
            <span className="attention-count">{pendingApprovals}</span>
          </div>
          <button className="attention-item" onClick={() => onOpenSection('approvals')}>
            <span className="attention-icon warning-icon"><Clock3 size={17} /></span>
            <span className="attention-copy"><strong>{'Verification requests'}</strong><small>{formatText('{{count}} waiting for review', { count: pendingApprovals })}</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="attention-item" onClick={() => onOpenSection('payouts')}>
            <span className="attention-icon purple-icon"><ArrowDownLeft size={17} /></span>
            <span className="attention-copy"><strong>{'Withdrawals in flight'}</strong><small>{metrics ? formatText('{{count}} awaiting the payout provider ({{amount}})', { count: metrics.pending_withdrawals, amount: formatMinorRupees(metrics.pending_withdrawals_minor) }) : UNAVAILABLE}</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="attention-item" onClick={() => onOpenSection('shifts')}>
            <span className="attention-icon blue-icon"><BriefcaseBusiness size={17} /></span>
            <span className="attention-copy"><strong>{'Shifts needing workers'}</strong><small>{formatText('{{count}} open shifts are not fully staffed', { count: understaffed })}</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="attention-item" onClick={() => onOpenSection('support')}>
            <span className="attention-icon orange-icon"><CircleHelp size={17} /></span>
            <span className="attention-copy"><strong>{'Support tickets'}</strong><small>{metrics ? formatText('{{count}} open tickets', { count: metrics.open_support_tickets }) : UNAVAILABLE}</small></span>
            <ArrowRight size={16} />
          </button>
          <div className="attention-footer">
            <span />
            <button className="text-action" onClick={() => onOpenSection('support')}>{'Open support'} <ArrowRight size={14} /></button>
          </div>
        </article>
      </section>

      <section className="overview-bottom-grid">
        <article className="panel table-panel">
          <div className="panel-heading">
            <div>
              <h2>{'Worker profiles'}</h2>
              <p>{'Profiles loaded from the live worker API'}</p>
            </div>
            <button className="text-action" onClick={() => onOpenSection('workers')}>{'View all'} <ArrowRight size={14} /></button>
          </div>
          <div className="compact-list">
            {workers.slice(0, 4).map((worker, index) => (
              <div className="compact-row" key={worker.id}>
                <ProfileAvatar
                  className={`user-avatar avatar-${index % 5}`}
                  imageUrl={worker.photoUrl}
                  name={worker.name}
                />
                <span className="compact-primary"><strong>{worker.name}</strong><small>{worker.categories[0] ?? 'No category'} · {worker.locality || worker.address}</small></span>
                <span className="compact-rating">{worker.ratingCount ? `★ ${worker.rating.toFixed(1)}` : '—'}</span>
                <div className="compact-worker-status">
                  <StatusBadge tone={worker.isActive ? 'success' : 'danger'}>
                    {worker.isActive ? 'Active' : 'Suspended'}
                  </StatusBadge>
                  <StatusBadge tone={worker.verificationStatus === 'verified' ? 'success' : worker.verificationStatus === 'pending' ? 'warning' : 'danger'}>
                    {worker.verificationStatus}
                  </StatusBadge>
                  <StatusBadge tone={worker.isAvailable ? 'blue' : 'neutral'}>
                    {worker.isAvailable ? 'Online' : 'Offline'}
                  </StatusBadge>
                </div>
              </div>
            ))}
            {workers.length === 0 ? <p className="empty-state">No worker profiles found.</p> : null}
          </div>
        </article>

        <article className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>{'Recent activity'}</h2>
              <p>{'Newest shifts, payments, withdrawals and tickets'}</p>
            </div>
          </div>
          <div className="activity-list">
            {activity.map(item => (
              <div className="activity-item" key={`${item.kind}-${item.id}`}>
                <span className={`activity-avatar activity-${item.tone}`}>{item.initials}</span>
                <span className="activity-copy"><strong>{item.text}</strong><small>{`${item.detail} · ${formatWhen(item.at)}`}</small></span>
              </div>
            ))}
            {activity.length === 0 ? <p className="empty-state">No marketplace activity yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="panel payments-strip">
        <div className="panel-heading">
          <div>
              <h2>{'Latest transactions'}</h2>
              <p>{'Recent payment activity across the platform'}</p>
          </div>
          <button className="button button-secondary compact-button" onClick={() => onOpenSection('payments')}>{'All payments'} <ArrowRight size={15} /></button>
        </div>
        <div className="payment-summary-row">
          {payments.slice(0, 3).map(payment => (
            <div className="payment-summary" key={payment.id}>
              <span className="payment-summary-icon"><CircleDollarSign size={18} /></span>
              <span><strong>{payment.businessName}</strong><small>{payment.reference} · {titleCase(payment.method)}</small></span>
              <strong>{formatMinorRupees(payment.amountMinor)}</strong>
              <StatusBadge tone={payment.status === 'succeeded' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}>{payment.status}</StatusBadge>
            </div>
          ))}
          {payments.length === 0 ? <p className="empty-state">No payments yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
