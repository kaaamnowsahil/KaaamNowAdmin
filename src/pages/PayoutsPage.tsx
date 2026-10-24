import type {
  Business,
  Payment,
  Payout,
  PayoutStatus,
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
  onSelect: (record: SelectedRecord) => void;
  onUpdatePayout: (payoutId: string, status: PayoutStatus) => void;
};

export function PayoutsPage({
  businesses,
  payments,
  payouts,
  approvals,
  search,
  onSearch,
  onSelect,
  onUpdatePayout,
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
      onSelect={onSelect}
      onUpdatePayout={onUpdatePayout}
    />
  );
}
