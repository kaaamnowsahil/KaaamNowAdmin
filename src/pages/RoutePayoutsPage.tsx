import { useState } from 'react';

import { CommissionRulesTab } from '@/features/route-payouts/CommissionRulesTab';
import { RouteOverviewTab } from '@/features/route-payouts/RouteOverviewTab';
import { RoutePaymentsTab } from '@/features/route-payouts/RoutePaymentsTab';
import {
  RouteAccountsTab,
  RouteReconciliationsTab,
  RouteRefundsTab,
} from '@/features/route-payouts/RouteReviewTabs';
import { RouteTransfersTab } from '@/features/route-payouts/RouteTransfersTab';

type Tab = 'overview' | 'payments' | 'transfers' | 'refunds' | 'accounts' | 'reconciliation' | 'commission';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview & export' },
  { id: 'payments', label: 'Payments' },
  { id: 'transfers', label: 'Worker transfers' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'accounts', label: 'Linked Accounts' },
  { id: 'reconciliation', label: 'Reconciliation' },
  { id: 'commission', label: 'Commission rules' },
];

type RoutePayoutsPageProps = { token: string; onSessionExpired: () => void };

/** Razorpay payments, Route transfers to Worker Linked Accounts, refunds and commission rules. */
export function RoutePayoutsPage({ token, onSessionExpired }: RoutePayoutsPageProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const props = { token, onSessionExpired };

  return (
    <section className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">RAZORPAY</p>
          <h1>Payments & Worker transfers</h1>
          <p>Business payments, Worker earnings sent through Razorpay Route, refunds and commission rules.</p>
        </div>
      </header>
      <div className="approve-row" role="tablist">
        {TABS.map((item) => (
          <button
            aria-selected={tab === item.id}
            className={tab === item.id ? 'primary-button' : 'secondary-button'}
            key={item.id}
            onClick={() => setTab(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <RouteOverviewTab {...props} />}
      {tab === 'payments' && <RoutePaymentsTab {...props} />}
      {tab === 'transfers' && <RouteTransfersTab {...props} />}
      {tab === 'refunds' && <RouteRefundsTab {...props} />}
      {tab === 'accounts' && <RouteAccountsTab {...props} />}
      {tab === 'reconciliation' && <RouteReconciliationsTab {...props} />}
      {tab === 'commission' && <CommissionRulesTab {...props} />}
    </section>
  );
}
