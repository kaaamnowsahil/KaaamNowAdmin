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
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onSelect: (record: SelectedRecord) => void;
  onResolveTicket: (ticketId: string) => void;
  busyTicketId?: string;
  serverTotal?: number;
};

export function SupportPage({
  businesses,
  payments,
  payouts,
  supportTickets,
  approvals,
  search,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  onSelect,
  onResolveTicket,
  busyTicketId,
  serverTotal,
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
      statusFilter={statusFilter}
      onStatusFilterChange={onStatusFilterChange}
      onSelect={onSelect}
      onResolveTicket={onResolveTicket}
      busyTicketId={busyTicketId}
      serverTotal={serverTotal}
    />
  );
}
