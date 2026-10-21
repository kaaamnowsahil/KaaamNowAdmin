import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleDollarSign,
  CircleHelp,
  Clock3,
  Download,
  MoreHorizontal,
  Plus,
  UsersRound,
} from 'lucide-react';

import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import type { AdminShift, Business, Payment, Payout, SupportTicket, Worker } from '@/types';
import { downloadCsv } from '@/utils/csv';
import { formatCompactRupees, formatCount, formatRupees } from '@/utils/format';

type OverviewPageProps = {
  workers: Worker[];
  businesses: Business[];
  shifts: AdminShift[];
  payments: Payment[];
  payouts: Payout[];
  supportTickets: SupportTicket[];
  pendingApprovals: number;
  onOpenSection: (section: 'workers' | 'businesses' | 'shifts' | 'payments' | 'payouts' | 'approvals' | 'support') => void;
};

const activityItems = [
  { initials: 'TW', tone: 'purple', text: 'Third Wave Coffee posted a live shift', detail: 'Koramangala · 2 min ago' },
  { initials: 'RD', tone: 'blue', text: 'Rohan Das submitted verification', detail: 'Worker · 18 min ago' },
  { initials: '₹', tone: 'green', text: 'Payout of ₹1,400 is processing', detail: 'PAY-62179 · 34 min ago' },
  { initials: 'PE', tone: 'orange', text: 'The Park Events joined KaaamNow', detail: 'Business · 1 hr ago' },
];

export function OverviewPage({
  workers,
  businesses,
  shifts,
  payments,
  payouts,
  supportTickets,
  pendingApprovals,
  onOpenSection,
}: OverviewPageProps) {
  const activeBusinesses = businesses.filter(business => business.status === 'active').length;
  const paidVolume = payments
    .filter(payment => payment.status === 'paid')
    .reduce((total, payment) => total + payment.amount, 0);
  const payoutsInProgress = payouts.filter(payout =>
    ['pending', 'processing'].includes(payout.status),
  ).length;
  const shiftsNeedingWorkers = shifts.filter(
    shift => shift.assignments.length < shift.workersNeeded,
  ).length;
  const openTickets = supportTickets.filter(ticket => ticket.status !== 'resolved').length;
  const exportReport = () => {
    downloadCsv(
      'kaaamnow-marketplace-overview',
      ['Metric', 'Value'],
      [
        ['Total workers', workers.length],
        ['Active businesses', activeBusinesses],
        ['Businesses total', businesses.length],
        ['Shifts in marketplace', shifts.length],
        ['Shifts needing workers', shiftsNeedingWorkers],
        ['Paid payment volume', paidVolume],
        ['Payouts in progress', payoutsInProgress],
        ['Pending verifications', pendingApprovals],
        ['Unresolved support tickets', openTickets],
      ],
    );
  };

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase()}</p>
          <h1>Good afternoon, Sarah <span className="wave">✦</span></h1>
          <p className="page-description">Here’s what’s happening across your marketplace today.</p>
        </div>
        <div className="welcome-actions">
          <button className="button button-secondary" onClick={exportReport}>
            <Download size={16} />
            Export report
          </button>
          <button className="button button-primary" onClick={() => onOpenSection('approvals')}>
            <Plus size={17} />
            Review queue
            <span className="button-count">{pendingApprovals}</span>
          </button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Marketplace metrics">
        <MetricCard label="Total workers" value={formatCount(workers.length)} note="Worker accounts in this dataset" icon={UsersRound} iconTone="tone-purple" />
        <MetricCard label="Active businesses" value={formatCount(activeBusinesses)} note={`of ${businesses.length} businesses`} icon={Building2} iconTone="tone-blue" />
        <MetricCard label="Shifts in marketplace" value={formatCount(shifts.length)} note={`${shiftsNeedingWorkers} need more workers`} icon={BriefcaseBusiness} iconTone="tone-orange" />
        <MetricCard label="Paid payment volume" value={formatCompactRupees(paidVolume)} note="Successful business charges" icon={CircleDollarSign} iconTone="tone-green" />
      </section>

      <section className="overview-main-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Marketplace activity</h2>
              <p>Shift volume and worker growth over time</p>
            </div>
            <button className="button button-select">Last 30 days <ChevronDown size={15} /></button>
          </div>
          <div className="chart-summary">
            <div>
              <strong>2,408</strong>
              <span>Total shifts posted</span>
            </div>
            <span className="chart-period"><ArrowUpRight size={14} /> 18.4%</span>
          </div>
          <div className="chart-wrap">
            <div className="chart-y-labels">
              <span>3k</span><span>2k</span><span>1k</span><span>0</span>
            </div>
            <svg className="activity-chart" viewBox="0 0 760 220" role="img" aria-label="Marketplace shifts trending upward over the last 30 days">
              <defs>
                <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity=".2" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[24, 78, 132, 186].map(y => <line key={y} x1="0" x2="760" y1={y} y2={y} className="chart-gridline" />)}
              <path d="M0 174 C34 162, 39 143, 70 151 S111 135, 138 145 S177 119, 207 126 S243 133, 276 108 S320 116, 346 99 S389 114, 415 88 S454 102, 483 78 S519 89, 553 66 S590 82, 620 58 S662 66, 691 43 S727 52, 760 28 L760 198 L0 198 Z" fill="url(#chartFill)" />
              <path d="M0 174 C34 162, 39 143, 70 151 S111 135, 138 145 S177 119, 207 126 S243 133, 276 108 S320 116, 346 99 S389 114, 415 88 S454 102, 483 78 S519 89, 553 66 S590 82, 620 58 S662 66, 691 43 S727 52, 760 28" className="chart-line" />
              <circle cx="553" cy="66" r="5" className="chart-point" />
            </svg>
            <div className="chart-x-labels">
              <span>Sep 21</span><span>Sep 26</span><span>Oct 01</span><span>Oct 06</span><span>Oct 11</span><span>Oct 16</span><span>Oct 20</span>
            </div>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot purple-dot" /> Shifts posted</span>
            <span><i className="legend-dot blue-dot" /> Workers onboarded</span>
            <button className="text-action" onClick={() => onOpenSection('shifts')}>View shift analytics <ArrowRight size={14} /></button>
          </div>
        </article>

        <article className="panel approvals-panel">
          <div className="panel-heading">
            <div>
              <h2>Needs your attention</h2>
              <p>Keep the marketplace moving</p>
            </div>
            <span className="attention-count">{pendingApprovals}</span>
          </div>
          <button className="attention-item" onClick={() => onOpenSection('approvals')}>
            <span className="attention-icon warning-icon"><Clock3 size={17} /></span>
            <span className="attention-copy"><strong>Verification requests</strong><small>{pendingApprovals} waiting for review</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="attention-item" onClick={() => onOpenSection('payouts')}>
            <span className="attention-icon purple-icon"><ArrowDownLeft size={17} /></span>
            <span className="attention-copy"><strong>Payouts in progress</strong><small>{payoutsInProgress} awaiting completion</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="attention-item" onClick={() => onOpenSection('shifts')}>
            <span className="attention-icon blue-icon"><BriefcaseBusiness size={17} /></span>
            <span className="attention-copy"><strong>Shifts needing workers</strong><small>{shiftsNeedingWorkers} shifts are not fully staffed</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="attention-item" onClick={() => onOpenSection('support')}>
            <span className="attention-icon orange-icon"><CircleHelp size={17} /></span>
            <span className="attention-copy"><strong>Support tickets</strong><small>{openTickets} unresolved tickets</small></span>
            <ArrowRight size={16} />
          </button>
          <div className="attention-footer">
            <span>Updated just now</span>
            <button className="text-action" onClick={() => onOpenSection('support')}>Open support <ArrowRight size={14} /></button>
          </div>
        </article>
      </section>

      <section className="overview-bottom-grid">
        <article className="panel table-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent workers</h2>
              <p>Latest people to join your network</p>
            </div>
            <button className="text-action" onClick={() => onOpenSection('workers')}>View all <ArrowRight size={14} /></button>
          </div>
          <div className="compact-list">
            {workers.slice(0, 4).map((worker, index) => (
              <div className="compact-row" key={worker.id}>
                <span className={`user-avatar avatar-${index % 5}`}>{worker.name.split(' ').map(part => part[0]).join('')}</span>
                <span className="compact-primary"><strong>{worker.name}</strong><small>{worker.workTypes[0]} · {worker.area}</small></span>
                <span className="compact-rating">★ {worker.rating.toFixed(1)}</span>
                <StatusBadge tone={worker.status === 'active' ? 'success' : worker.status === 'pending' ? 'warning' : 'danger'}>{worker.status}</StatusBadge>
              </div>
            ))}
          </div>
        </article>

        <article className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Live updates from your marketplace</p>
            </div>
            <button className="icon-button" aria-label="More activity options"><MoreHorizontal size={19} /></button>
          </div>
          <div className="activity-list">
            {activityItems.map(item => (
              <div className="activity-item" key={item.text}>
                <span className={`activity-avatar activity-${item.tone}`}>{item.initials}</span>
                <span className="activity-copy"><strong>{item.text}</strong><small>{item.detail}</small></span>
              </div>
            ))}
          </div>
          <button className="activity-link">See all activity <ArrowRight size={14} /></button>
        </article>
      </section>

      <section className="panel payments-strip">
        <div className="panel-heading">
          <div>
            <h2>Latest transactions</h2>
            <p>Recent payment activity across the platform</p>
          </div>
          <button className="button button-secondary compact-button" onClick={() => onOpenSection('payments')}>All payments <ArrowRight size={15} /></button>
        </div>
        <div className="payment-summary-row">
          {payments.slice(0, 3).map(payment => (
            <div className="payment-summary" key={payment.id}>
              <span className="payment-summary-icon"><CircleDollarSign size={18} /></span>
              <span><strong>{payment.businessName}</strong><small>{payment.reference} · {payment.role}</small></span>
              <strong>{formatRupees(payment.amount)}</strong>
              <StatusBadge tone={payment.status === 'paid' ? 'success' : payment.status === 'pending' ? 'warning' : 'neutral'}>{payment.status}</StatusBadge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
