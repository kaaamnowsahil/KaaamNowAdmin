import { listRecords } from './adminResources';
import type {
  AssignmentRecord,
  InvoiceRecord,
  MarketplaceRecords,
  PaymentRecord,
  PayoutAccountRecord,
  ShiftRecord,
  WithdrawalRecord,
} from './marketplaceMappers';
import { getUserSummaries, type SupportTicketRecord } from './supportTickets';

const PAGE_SIZE = 200;
/** Newest rows loaded per table; `totals` reports how many exist server-side. */
export const RECENT_LIMIT = 1_000;

export type RecentRows<T> = { items: T[]; total: number };

export async function listRecentRecords<T>(
  token: string,
  resource: string,
  sort: string,
  max = RECENT_LIMIT,
): Promise<RecentRows<T>> {
  const items: T[] = [];
  let total = 0;
  for (let offset = 0; offset < max; offset += PAGE_SIZE) {
    const page = await listRecords<T>(token, resource, { sort, limit: PAGE_SIZE, offset });
    total = page.total;
    items.push(...page.items);
    if (items.length >= page.total || page.items.length < PAGE_SIZE) break;
  }
  return { items: items.slice(0, max), total };
}

export type MarketplaceTotals = {
  shifts: number;
  payments: number;
  withdrawals: number;
  supportTickets: number;
};

export async function loadMarketplaceRecords(
  token: string,
): Promise<{ records: MarketplaceRecords; totals: MarketplaceTotals }> {
  const [shifts, assignments, payments, invoices, withdrawals, payoutAccounts, tickets] =
    await Promise.all([
      listRecentRecords<ShiftRecord>(token, 'shifts', '-created_at'),
      listRecentRecords<AssignmentRecord>(token, 'shift_assignments', '-created_at', 5_000),
      listRecentRecords<PaymentRecord>(token, 'payments', '-created_at'),
      listRecentRecords<InvoiceRecord>(token, 'shift_invoices', '-created_at', 2_000),
      listRecentRecords<WithdrawalRecord>(token, 'withdrawals', '-created_at'),
      listRecentRecords<PayoutAccountRecord>(token, 'payout_accounts', '-created_at', 5_000),
      listRecentRecords<SupportTicketRecord>(token, 'support_tickets', '-created_at', 500),
    ]);
  const users = await getUserSummaries(
    token,
    tickets.items.map(ticket => ticket.user_id),
  );
  return {
    records: {
      shifts: shifts.items,
      assignments: assignments.items,
      payments: payments.items,
      invoices: invoices.items,
      withdrawals: withdrawals.items,
      payoutAccounts: payoutAccounts.items,
      supportTickets: tickets.items,
      users,
    },
    totals: {
      shifts: shifts.total,
      payments: payments.total,
      withdrawals: withdrawals.total,
      supportTickets: tickets.total,
    },
  };
}
