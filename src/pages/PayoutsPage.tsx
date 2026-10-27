import type {
  Business,
  Payment,
  Payout,
  AdminVerificationRequest,
} from '@/types';

import { ManagementPage, type SelectedRecord } from './ManagementPage';

type PayoutsPageProps = {
  businesses: Business[];
  payments: Payment[];
  payouts: Payout[];
  approvals: AdminVerificationRequest[];
  search: string;
  onSearch: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onSelect: (record: SelectedRecord) => void;
  serverTotal?: number;
};

/** Read-only: withdrawal status is driven by the payout provider sync, not the dashboard. */
export function PayoutsPage({
  businesses,
  payments,
  payouts,
  approvals,
  search,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  onSelect,
  serverTotal,
}: PayoutsPageProps) {
  return (
    <ManagementPage
      section="payouts"
      businesses={businesses}
      shifts={[]}
      payments={payments}
      payouts={payouts}
      supportTickets={[]}
      approvals={approvals}
      search={search}
      onSearch={onSearch}
      statusFilter={statusFilter}
      onStatusFilterChange={onStatusFilterChange}
      onSelect={onSelect}
      serverTotal={serverTotal}
    />
  );
}
