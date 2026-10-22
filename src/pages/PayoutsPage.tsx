import type {
  Business,
  Payment,
  Payout,
  PayoutStatus,
  VerificationRequest,
  Worker,
} from '@/types';

import { ManagementPage, type SelectedRecord } from './ManagementPage';

type PayoutsPageProps = {
  workers: Worker[];
  businesses: Business[];
  payments: Payment[];
  payouts: Payout[];
  approvals: VerificationRequest[];
  search: string;
  onSearch: (value: string) => void;
  onSelect: (record: SelectedRecord) => void;
  onReviewApproval: (id: string, action: 'approved' | 'rejected') => void;
  onUpdatePayout: (payoutId: string, status: PayoutStatus) => void;
};

export function PayoutsPage({
  workers,
  businesses,
  payments,
  payouts,
  approvals,
  search,
  onSearch,
  onSelect,
  onReviewApproval,
  onUpdatePayout,
}: PayoutsPageProps) {
  return (
    <ManagementPage
      section="payouts"
      workers={workers}
      businesses={businesses}
      shifts={[]}
      payments={payments}
      payouts={payouts}
      supportTickets={[]}
      approvals={approvals}
      search={search}
      onSearch={onSearch}
      onSelect={onSelect}
      onReviewApproval={onReviewApproval}
      onUpdatePayout={onUpdatePayout}
    />
  );
}
