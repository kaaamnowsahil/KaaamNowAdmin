import { ApiError, apiRequest, getApiBaseUrl } from './client';

export type TransferStatus =
  | 'not_eligible'
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'reversed';
export type RefundStatus = 'requested' | 'approved' | 'pending' | 'processed' | 'failed' | 'rejected';
export type ExportKind = 'transfers' | 'payments' | 'refunds';

export type Page<T> = { items: T[]; total: number; limit: number; offset: number };

export type RouteConfig = {
  route_enabled: boolean;
  razorpayx_payout_enabled: boolean;
  require_admin_approval: boolean;
  mode: 'test' | 'live';
  payment_provider: string;
  payout_provider: string;
  linked_account_category_set: boolean;
  webhook_secret_set: boolean;
};

export type RouteOverview = {
  captured_minor: number;
  captured_count: number;
  worker_gross_minor: number;
  worker_commission_minor: number;
  refunded_minor: number;
  refunds_awaiting: number;
  open_reconciliations: number;
  transfers: Record<string, { count: number; amount_minor: number }>;
};

export type RouteTransfer = {
  id: string;
  status: TransferStatus;
  invoice_id: string;
  assignment_id: string;
  worker_profile_id: string;
  worker_name: string;
  business_name: string;
  job_title: string;
  payment_id: string | null;
  payment_reference: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_transfer_id: string | null;
  linked_account_id: string | null;
  gross_minor: number;
  commission_minor: number;
  amount_minor: number;
  reversed_minor: number;
  currency: string;
  failure_reason: string | null;
  attempts: number;
  approved_at: string | null;
  initiated_at: string | null;
  processed_at: string | null;
  released_at: string | null;
  created_at: string;
};

export type RoutePayment = {
  id: string;
  reference: string;
  status: string;
  gateway_status: string;
  provider: string;
  method: string;
  amount_minor: number;
  refunded_minor: number;
  transferred_minor: number;
  currency: string;
  provider_order_id: string;
  provider_payment_id: string | null;
  invoice_id: string;
  invoice_kind: string;
  invoice_reference: string;
  business_name: string;
  job_title: string;
  paid_at: string | null;
  created_at: string;
};

export type RouteRefund = {
  id: string;
  payment_id: string;
  payment_reference: string;
  provider_payment_id: string | null;
  business_name: string;
  amount_minor: number;
  currency: string;
  reason: string;
  reverse_transfers: boolean;
  reversed_minor: number;
  status: RefundStatus;
  provider_refund_id: string | null;
  failure_reason: string | null;
  attempts: number;
  approved_at: string | null;
  processed_at: string | null;
  created_at: string;
};

export type LinkedAccount = {
  id: string;
  worker_profile_id: string;
  worker_name: string;
  worker_phone: string;
  razorpay_account_id: string | null;
  product_id: string | null;
  activation_status: string;
  account_status: string | null;
  legal_name: string;
  bank_account_last4: string | null;
  ifsc: string | null;
  requirements: Record<string, unknown>[];
  last_error: string | null;
  activated_at: string | null;
  updated_at: string;
};

export type Reconciliation = {
  id: string;
  kind: string;
  subject_id: string;
  razorpay_id: string | null;
  local_status: string;
  provider_status: string | null;
  detail: string;
  status: 'open' | 'resolved';
  resolved_at: string | null;
  created_at: string;
};

export type RefundRequest = { amount_minor: number; reason: string; reverse_transfers: boolean };

const BASE = '/api/v1/admin/route';
export const PAGE_SIZE = 50;

function listQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

const post = <T,>(token: string, path: string, body?: object) =>
  apiRequest<T>(`${BASE}${path}`, token, {
    method: 'POST',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

export const getRouteConfig = (token: string) => apiRequest<RouteConfig>(`${BASE}/config`, token);
export const getRouteOverview = (token: string) =>
  apiRequest<RouteOverview>(`${BASE}/overview`, token);

export const getRoutePayments = (token: string, status = '', q = '', offset = 0) =>
  apiRequest<Page<RoutePayment>>(
    `${BASE}/payments${listQuery({ status, q, limit: PAGE_SIZE, offset })}`,
    token,
  );
export const requestRefund = (token: string, paymentId: string, body: RefundRequest) =>
  post<RouteRefund>(token, `/payments/${encodeURIComponent(paymentId)}/refunds`, body);

export const getRouteTransfers = (token: string, status = '', offset = 0) =>
  apiRequest<Page<RouteTransfer>>(
    `${BASE}/transfers${listQuery({ status, limit: PAGE_SIZE, offset })}`,
    token,
  );
export type TransferAction = 'approve' | 'retry' | 'sync' | 'release';
export const runTransferAction = (token: string, transferId: string, action: TransferAction) =>
  post<RouteTransfer>(token, `/transfers/${encodeURIComponent(transferId)}/${action}`);

export const getRouteRefunds = (token: string, status = '', offset = 0) =>
  apiRequest<Page<RouteRefund>>(
    `${BASE}/refunds${listQuery({ status, limit: PAGE_SIZE, offset })}`,
    token,
  );
export const approveRefund = (token: string, refundId: string) =>
  post<RouteRefund>(token, `/refunds/${encodeURIComponent(refundId)}/approve`);
export const rejectRefund = (token: string, refundId: string, reason: string) =>
  post<RouteRefund>(token, `/refunds/${encodeURIComponent(refundId)}/reject`, {
    reason: reason.trim(),
  });

export const getLinkedAccounts = (token: string, status = '', offset = 0) =>
  apiRequest<Page<LinkedAccount>>(
    `${BASE}/linked-accounts${listQuery({ status, limit: PAGE_SIZE, offset })}`,
    token,
  );
export const refreshLinkedAccount = (token: string, accountId: string) =>
  post<LinkedAccount>(token, `/linked-accounts/${encodeURIComponent(accountId)}/refresh`);

export const getReconciliations = (token: string, status = '', offset = 0) =>
  apiRequest<Page<Reconciliation>>(
    `${BASE}/reconciliations${listQuery({ status, limit: PAGE_SIZE, offset })}`,
    token,
  );
export const resolveReconciliation = (token: string, id: string) =>
  post<Reconciliation>(token, `/reconciliations/${encodeURIComponent(id)}/resolve`);

/** Downloads the CSV with the admin's bearer token (a plain link would not send it). */
export async function downloadRouteCsv(token: string, kind: ExportKind, status = '') {
  const base = getApiBaseUrl();
  if (!base) throw new ApiError('VITE_API_BASE_URL is not configured.');
  let response: Response;
  try {
    response = await fetch(`${base}${BASE}/export${listQuery({ kind, status })}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? `Export failed (${response.status}).`, response.status);
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `kaaamnow-route-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
