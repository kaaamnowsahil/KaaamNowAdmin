import type {
  AdminShift,
  Business,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Payout,
  PayoutMethod,
  PayoutStatus,
  ShiftKind,
  ShiftStatus,
  SupportTicket,
  Worker,
} from '@/types';
import type { AdminUserSummary, SupportTicketRecord } from './supportTickets';

export type ShiftRecord = {
  id: string;
  business_profile_id: string;
  shift_type: ShiftKind;
  status: ShiftStatus;
  job_title: string;
  responsibilities: string;
  requirements: string;
  workers_required: number;
  hourly_rate_minor: number;
  /** Older rows predate task pricing; missing means hourly. */
  pricing_mode?: 'hourly' | 'task' | null;
  task_price_minor?: number | null;
  starts_at: string;
  ends_at: string;
  workplace_name: string;
  address_text: string;
  search_radius_km: number | string | null;
  created_at: string;
  cancel_reason: string | null;
};

export type AssignmentRecord = { id: string; shift_id: string; status: string };

export type PaymentRecord = {
  id: string;
  invoice_id: string;
  business_profile_id: string;
  method: PaymentMethod;
  provider: string;
  status: PaymentStatus;
  amount_minor: number;
  reference: string;
  paid_at: string | null;
  failure_reason: string | null;
  created_at: string;
};

export type InvoiceRecord = {
  id: string;
  reference: string;
  worker_subtotal_minor: number;
  platform_fee_minor: number;
};

export type WithdrawalRecord = {
  id: string;
  worker_profile_id: string;
  payout_account_id: string;
  amount_minor: number;
  status: PayoutStatus;
  reference: string;
  provider: string;
  failure_reason: string | null;
  initiated_at: string;
  completed_at: string | null;
};

export type PayoutAccountRecord = {
  id: string;
  account_type: 'upi' | 'paytm' | 'bank';
  upi_id: string | null;
  paytm_phone: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
};

export type MarketplaceRecords = {
  shifts: ShiftRecord[];
  assignments: AssignmentRecord[];
  payments: PaymentRecord[];
  invoices: InvoiceRecord[];
  withdrawals: WithdrawalRecord[];
  payoutAccounts: PayoutAccountRecord[];
  supportTickets: SupportTicketRecord[];
  users: Map<string, AdminUserSummary>;
};

export const UNKNOWN_BUSINESS = 'Unknown business';
export const UNKNOWN_WORKER = 'Unknown worker';
export const UNKNOWN_USER = 'Unknown user';

/** Assignment states that no longer hold a seat on the shift. */
const RELEASED_ASSIGNMENT_STATUSES = new Set(['cancelled', 'no_show']);

const byId = <T extends { id: string }>(rows: readonly T[]) =>
  new Map(rows.map(row => [row.id, row]));

const toNumberOrNull = (value: number | string | null) => {
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function mapShifts(
  shifts: readonly ShiftRecord[],
  assignments: readonly AssignmentRecord[],
  businesses: readonly Business[],
): AdminShift[] {
  const businessById = byId(businesses);
  const seats = new Map<string, number>();
  for (const assignment of assignments) {
    if (RELEASED_ASSIGNMENT_STATUSES.has(assignment.status)) continue;
    seats.set(assignment.shift_id, (seats.get(assignment.shift_id) ?? 0) + 1);
  }
  return shifts.map(shift => {
    const business = businessById.get(shift.business_profile_id);
    return {
      id: shift.id,
      kind: shift.shift_type,
      status: shift.status,
      role: shift.job_title,
      businessId: shift.business_profile_id,
      businessName: business?.name || shift.workplace_name || UNKNOWN_BUSINESS,
      area: business?.locality || shift.address_text,
      startsAt: shift.starts_at,
      endsAt: shift.ends_at,
      hourlyRateMinor: shift.hourly_rate_minor,
      pricingMode: shift.pricing_mode === 'task' ? 'task' : 'hourly',
      taskPriceMinor: shift.task_price_minor ?? null,
      workersNeeded: shift.workers_required,
      assignedCount: seats.get(shift.id) ?? 0,
      requirement: shift.requirements,
      responsibilities: shift.responsibilities,
      searchRadiusKm: toNumberOrNull(shift.search_radius_km),
      createdAt: shift.created_at,
      cancelReason: shift.cancel_reason,
    };
  });
}

export function mapPayments(
  payments: readonly PaymentRecord[],
  invoices: readonly InvoiceRecord[],
  businesses: readonly Business[],
): Payment[] {
  const invoiceById = byId(invoices);
  const businessById = byId(businesses);
  return payments.map(payment => {
    const invoice = invoiceById.get(payment.invoice_id);
    return {
      id: payment.id,
      reference: payment.reference,
      businessId: payment.business_profile_id,
      businessName: businessById.get(payment.business_profile_id)?.name || UNKNOWN_BUSINESS,
      invoiceId: payment.invoice_id,
      invoiceReference: invoice?.reference ?? null,
      subtotalMinor: invoice?.worker_subtotal_minor ?? null,
      platformFeeMinor: invoice?.platform_fee_minor ?? null,
      amountMinor: payment.amount_minor,
      method: payment.method,
      provider: payment.provider,
      status: payment.status,
      createdAt: payment.created_at,
      paidAt: payment.paid_at,
      failureReason: payment.failure_reason,
    };
  });
}

const PAYOUT_METHODS: Record<PayoutAccountRecord['account_type'], PayoutMethod> = {
  upi: 'UPI',
  paytm: 'Paytm',
  bank: 'Bank',
};

/** Never exposes a full bank account number in the dashboard. */
export function payoutDestination(account: PayoutAccountRecord | undefined): string {
  if (!account) return '';
  if (account.account_type === 'upi') return account.upi_id ?? '';
  if (account.account_type === 'paytm') return account.paytm_phone ?? '';
  const last4 = (account.bank_account_number ?? '').slice(-4);
  return [last4 ? `•••• ${last4}` : '', account.bank_ifsc ?? ''].filter(Boolean).join(' · ');
}

export function mapPayouts(
  withdrawals: readonly WithdrawalRecord[],
  accounts: readonly PayoutAccountRecord[],
  workers: readonly Worker[],
): Payout[] {
  const accountById = byId(accounts);
  const workerById = byId(workers);
  return withdrawals.map(withdrawal => {
    const account = accountById.get(withdrawal.payout_account_id);
    return {
      id: withdrawal.id,
      reference: withdrawal.reference,
      workerId: withdrawal.worker_profile_id,
      workerName: workerById.get(withdrawal.worker_profile_id)?.name || UNKNOWN_WORKER,
      amountMinor: withdrawal.amount_minor,
      method: account ? PAYOUT_METHODS[account.account_type] : 'Unknown',
      destination: payoutDestination(account),
      provider: withdrawal.provider,
      requestedAt: withdrawal.initiated_at,
      completedAt: withdrawal.completed_at,
      status: withdrawal.status,
      failureReason: withdrawal.failure_reason,
    };
  });
}

export function mapSupportTickets(
  tickets: readonly SupportTicketRecord[],
  users: ReadonlyMap<string, AdminUserSummary>,
): SupportTicket[] {
  return tickets.map(ticket => {
    const user = users.get(ticket.user_id);
    return {
      id: ticket.id,
      subject: ticket.subject,
      message: ticket.message,
      topic: ticket.topic,
      priority: ticket.priority,
      status: ticket.status,
      raisedBy: {
        id: ticket.user_id,
        name: user?.full_name || UNKNOWN_USER,
        phone: user?.phone ?? null,
      },
      shiftId: ticket.shift_id,
      assignmentId: ticket.assignment_id,
      resolutionNote: ticket.resolution_note,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };
  });
}

/** Paise to rupees for display helpers that take whole rupees. */
export const minorToRupees = (minor: number) => minor / 100;
