import { apiRequest } from './client';

export type OverrideAction =
  | 'waive_worker_fee'
  | 'void_strike'
  | 'unban_worker'
  | 'revoke_voucher'
  | 'refund_business';

export type OverrideRequest = {
  action: OverrideAction;
  /** 5–500 characters. */
  reason: string;
  /** Only for refund_business. */
  amount_minor?: number;
  support_ticket_id?: string;
};

export type OverrideView = {
  id: string;
  action: OverrideAction;
  amount_minor: number;
  reason: string;
  admin_user_id: string | null;
  support_ticket_id: string | null;
  created_at: string;
};

export type LedgerLine = {
  kind: string;
  amount_minor: number;
  description: string;
  created_at: string;
};

export type BookingLedger = {
  assignment_id: string;
  shift_id: string;
  job_title: string;
  status: string;
  worker_name: string | null;
  business_name: string;
  currency: string;
  invoices: LedgerLine[];
  charges: LedgerLine[];
  worker_entries: LedgerLine[];
  strikes: LedgerLine[];
  vouchers: LedgerLine[];
  overrides: OverrideView[];
};

export const OVERRIDE_ACTION_LABELS: Record<OverrideAction, string> = {
  waive_worker_fee: 'Waive worker fee',
  void_strike: 'Void strike',
  unban_worker: 'Unban / unlimit worker',
  revoke_voucher: 'Revoke business voucher',
  refund_business: 'Refund business',
};

const bookingUrl = (assignmentId: string) =>
  `/api/v1/admin/bookings/${encodeURIComponent(assignmentId)}`;

export function getBookingLedger(token: string, assignmentId: string): Promise<BookingLedger> {
  return apiRequest<BookingLedger>(`${bookingUrl(assignmentId)}/ledger`, token);
}

export function applyBookingOverride(
  token: string,
  assignmentId: string,
  body: OverrideRequest,
): Promise<OverrideView> {
  return apiRequest<OverrideView>(`${bookingUrl(assignmentId)}/overrides`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
