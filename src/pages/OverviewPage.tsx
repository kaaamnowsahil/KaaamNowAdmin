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
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
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
      [t('Metric'), t('Value')],
      [
        [t('Total workers'), workers.length],
        [t('Active businesses'), activeBusinesses],
        [t('Businesses total'), businesses.length],
        [t('Shifts in marketplace'), shifts.length],
        [t('Shifts needing workers'), shiftsNeedingWorkers],
        [t('Paid payment volume'), paidVolume],
        [t('Payouts in progress'), payoutsInProgress],
        [t('Pending verifications'), pendingApprovals],
        [t('Unresolved support tickets'), openTickets],
      ],
    );
  };

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{new Intl.DateTimeFormat(i18n.resolvedLanguage === 'hi' ? 'hi-IN' : i18n.resolvedLanguage === 'kn' ? 'kn-IN' : 'en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase()}</p>
          <h1>{t('Good afternoon, Sarah ')}<span className="wave">✦</span></h1>
          <p className="page-description">{t('Here’s what’s happening across your marketplace today.')}</p>
        </div>
        <div className="welcome-actions">
          <button className="button button-secondary" onClick={exportReport}>
            <Download size={16} />
            {t('Export report')}
          </button>
          <button className="button button-primary" onClick={() => onOpenSection('approvals')}>
            <Plus size={17} />
            {t('Review queue')}
            <span className="button-count">{pendingApprovals}</span>
          </button>
        </div>
      </section>

      <section className="metric-grid" aria-label={t('Marketplace metrics')}>
        <MetricCard label="Total workers" value={formatCount(workers.length)} note="Worker accounts in this dataset" icon={UsersRound} iconTone="tone-purple" />
        <MetricCard label="Active businesses" value={formatCount(activeBusinesses)} note="of {{count}} businesses" noteValues={{ count: businesses.length }} icon={Building2} iconTone="tone-blue" />
        <MetricCard label="Shifts in marketplace" value={formatCount(shifts.length)} note="{{count}} need more workers" noteValues={{ count: shiftsNeedingWorkers }} icon={BriefcaseBusiness} iconTone="tone-orange" />
        <MetricCard label="Paid payment volume" value={formatCompactRupees(paidVolume)} note="Successful business charges" icon={CircleDollarSign} iconTone="tone-green" />
      </section>

      <section className="overview-main-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>{t('Marketplace activity')}</h2>
              <p>{t('Shift volume and worker growth over time')}</p>
            </div>
            <button className="button button-select">{t('Last 30 days')} <ChevronDown size={15} /></button>
          </div>
          <div className="chart-summary">
            <div>
              <strong>2,408</strong>
              <span>{t('Total shifts posted')}</span>
            </div>
            <span className="chart-period"><ArrowUpRight size={14} /> 18.4%</span>
          </div>
          <div className="chart-wrap">
            <div className="chart-y-labels">
              <span>3k</span><span>2k</span><span>1k</span><span>0</span>
            </div>
            <svg className="activity-chart" viewBox="0 0 760 220" role="img" aria-label={t('Marketplace shifts trending upward over the last 30 days')}>
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
              <span>{t('Sep 21')}</span><span>{t('Sep 26')}</span><span>{t('Oct 01')}</span><span>{t('Oct 06')}</span><span>{t('Oct 11')}</span><span>{t('Oct 16')}</span><span>{t('Oct 20')}</span>
            </div>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot purple-dot" /> {t('Shifts posted')}</span>
            <span><i className="legend-dot blue-dot" /> {t('Workers onboarded')}</span>
            <button className="text-action" onClick={() => onOpenSection('shifts')}>{t('View shift analytics')} <ArrowRight size={14} /></button>
          </div>
        </article>

        <article className="panel approvals-panel">
          <div className="panel-heading">
            <div>
              <h2>{t('Needs your attention')}</h2>
              <p>{t('Keep the marketplace moving')}</p>
            </div>
            <span className="attention-count">{pendingApprovals}</span>
          </div>
          <button className="attention-item" onClick={() => onOpenSection('approvals')}>
            <span className="attention-icon warning-icon"><Clock3 size={17} /></span>
            <span className="attention-copy"><strong>{t('Verification requests')}</strong><small>{t('{{count}} waiting for review', { count: pendingApprovals })}</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="attention-item" onClick={() => onOpenSection('payouts')}>
            <span className="attention-icon purple-icon"><ArrowDownLeft size={17} /></span>
            <span className="attention-copy"><strong>{t('Payouts in progress')}</strong><small>{t('{{count}} awaiting completion', { count: payoutsInProgress })}</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="attention-item" onClick={() => onOpenSection('shifts')}>
            <span className="attention-icon blue-icon"><BriefcaseBusiness size={17} /></span>
            <span className="attention-copy"><strong>{t('Shifts needing workers')}</strong><small>{t('{{count}} shifts are not fully staffed', { count: shiftsNeedingWorkers })}</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="attention-item" onClick={() => onOpenSection('support')}>
            <span className="attention-icon orange-icon"><CircleHelp size={17} /></span>
            <span className="attention-copy"><strong>{t('Support tickets')}</strong><small>{t('{{count}} unresolved tickets', { count: openTickets })}</small></span>
            <ArrowRight size={16} />
          </button>
          <div className="attention-footer">
            <span>{t('Updated just now')}</span>
            <button className="text-action" onClick={() => onOpenSection('support')}>{t('Open support')} <ArrowRight size={14} /></button>
          </div>
        </article>
      </section>

      <section className="overview-bottom-grid">
        <article className="panel table-panel">
          <div className="panel-heading">
            <div>
              <h2>{t('Recent workers')}</h2>
              <p>{t('Latest people to join your network')}</p>
            </div>
            <button className="text-action" onClick={() => onOpenSection('workers')}>{t('View all')} <ArrowRight size={14} /></button>
          </div>
          <div className="compact-list">
            {workers.slice(0, 4).map((worker, index) => (
              <div className="compact-row" key={worker.id}>
                <span className={`user-avatar avatar-${index % 5}`}>{worker.name.split(' ').map(part => part[0]).join('')}</span>
          <span className="compact-primary"><strong>{worker.name}</strong><small>{t(worker.workTypes[0] ?? '')} · {t(worker.area)}</small></span>
                <span className="compact-rating">★ {worker.rating.toFixed(1)}</span>
                <StatusBadge tone={worker.status === 'active' ? 'success' : worker.status === 'pending' ? 'warning' : 'danger'}>{worker.status}</StatusBadge>
              </div>
            ))}
          </div>
        </article>

        <article className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>{t('Recent activity')}</h2>
              <p>{t('Live updates from your marketplace')}</p>
            </div>
            <button className="icon-button" aria-label={t('More activity options')}><MoreHorizontal size={19} /></button>
          </div>
          <div className="activity-list">
            {activityItems.map(item => (
              <div className="activity-item" key={item.text}>
                <span className={`activity-avatar activity-${item.tone}`}>{item.initials}</span>
                <span className="activity-copy"><strong>{t(item.text)}</strong><small>{t(item.detail)}</small></span>
              </div>
            ))}
          </div>
          <button className="activity-link">{t('See all activity')} <ArrowRight size={14} /></button>
        </article>
      </section>

      <section className="panel payments-strip">
        <div className="panel-heading">
          <div>
              <h2>{t('Latest transactions')}</h2>
              <p>{t('Recent payment activity across the platform')}</p>
          </div>
          <button className="button button-secondary compact-button" onClick={() => onOpenSection('payments')}>{t('All payments')} <ArrowRight size={15} /></button>
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
