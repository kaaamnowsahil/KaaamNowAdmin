import type {
  Business,
  Payment,
  Payout,
  SupportTicket,
  VerificationRequest,
  Worker,
} from '@/types';

import { ManagementPage, type SelectedRecord } from './ManagementPage';

type SupportPageProps = {
  workers: Worker[];
  businesses: Business[];
  payments: Payment[];
  payouts: Payout[];
  supportTickets: SupportTicket[];
  approvals: VerificationRequest[];
  search: string;
  onSearch: (value: string) => void;
  onSelect: (record: SelectedRecord) => void;
  onReviewApproval: (id: string, action: 'approved' | 'rejected') => void;
  onResolveTicket: (ticketId: string) => void;
};

export function SupportPage({
  workers,
  businesses,
  payments,
  payouts,
  supportTickets,
  approvals,
  search,
  onSearch,
  onSelect,
  onReviewApproval,
  onResolveTicket,
}: SupportPageProps) {
  return (
    <ManagementPage
      section="support"
      workers={workers}
      businesses={businesses}
      shifts={[]}
      payments={payments}
      payouts={payouts}
      supportTickets={supportTickets}
      approvals={approvals}
      search={search}
      onSearch={onSearch}
      onSelect={onSelect}
      onReviewApproval={onReviewApproval}
      onResolveTicket={onResolveTicket}
    />
  );
}
