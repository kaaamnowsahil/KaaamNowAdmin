import type {
  Business,
  Payment,
  Payout,
  SupportTicket,
  AdminVerificationRequest,
} from '@/types';

import { ManagementPage, type SelectedRecord } from './ManagementPage';

type SupportPageProps = {
  businesses: Business[];
  payments: Payment[];
  payouts: Payout[];
  supportTickets: SupportTicket[];
  approvals: AdminVerificationRequest[];
  search: string;
  onSearch: (value: string) => void;
  onSelect: (record: SelectedRecord) => void;
  onResolveTicket: (ticketId: string) => void;
};

export function SupportPage({
  businesses,
  payments,
  payouts,
  supportTickets,
  approvals,
  search,
  onSearch,
  onSelect,
  onResolveTicket,
}: SupportPageProps) {
  return (
    <ManagementPage
      section="support"
      businesses={businesses}
      shifts={[]}
      payments={payments}
      payouts={payouts}
      supportTickets={supportTickets}
      approvals={approvals}
      search={search}
      onSearch={onSearch}
      onSelect={onSelect}
      onResolveTicket={onResolveTicket}
    />
  );
}
