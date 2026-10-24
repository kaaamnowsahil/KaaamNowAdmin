import { apiRequest } from '@/api/client';

export { ApiError } from '@/api/client';

export type DeletionStatus = 'pending' | 'approved' | 'on_hold' | 'completed';

export type HoldBasis =
  | 'pending_booking'
  | 'pending_payment'
  | 'refund'
  | 'dispute'
  | 'complaint'
  | 'legal_obligation'
  | 'fraud_investigation';

export type DeletionHold = {
  id: string;
  basis: HoldBasis;
  reason: string;
  reference: string | null;
  expires_at: string;
};

export type DeletionRequest = {
  id: string;
  user_id: string;
  phone: string;
  full_name: string;
  roles: string[];
  status: DeletionStatus;
  requested_at: string;
  approved_at: string | null;
  completed_at: string | null;
  blockers: string[];
  holds: DeletionHold[];
};

export type AuditEvent = {
  id?: string;
  event?: string;
  action?: string;
  actor?: string;
  actor_id?: string;
  created_at?: string;
  occurred_at?: string;
  details?: string | Record<string, unknown>;
  [key: string]: unknown;
};

export type DeletionDetail = {
  request: DeletionRequest;
  audit_events: AuditEvent[];
};

export type DeletionQueue = {
  items: DeletionRequest[];
  total: number;
  limit: number;
  offset: number;
};

export function getDeletionRequests(
  token: string,
  status: DeletionStatus,
  offset = 0,
) {
  const params = new URLSearchParams({ status, limit: '50', offset: String(offset) });
  return apiRequest<DeletionQueue>(
    `/api/v1/admin/account-deletion-requests?${params.toString()}`,
    token,
  );
}

export async function getDeletionDetail(token: string, id: string) {
  const response = await apiRequest<DeletionDetail & Partial<DeletionRequest>>(
    `/api/v1/admin/account-deletion-requests/${encodeURIComponent(id)}`,
    token,
  );
  return {
    request: (response.request ?? response) as DeletionRequest,
    audit_events: response.audit_events ?? [],
  };
}

export function approveDeletionRequest(token: string, id: string) {
  return apiRequest<unknown>(
    `/api/v1/admin/account-deletion-requests/${encodeURIComponent(id)}/approve`,
    token,
    { method: 'POST' },
  );
}

export function addDeletionHold(
  token: string,
  id: string,
  hold: {
    basis: HoldBasis;
    reason: string;
    reference: string | null;
    expires_at: string;
  },
) {
  return apiRequest<unknown>(
    `/api/v1/admin/account-deletion-requests/${encodeURIComponent(id)}/holds`,
    token,
    { method: 'POST', body: JSON.stringify(hold) },
  );
}

export function releaseDeletionHold(token: string, id: string, holdId: string) {
  return apiRequest<unknown>(
    `/api/v1/admin/account-deletion-requests/${encodeURIComponent(id)}/holds/${encodeURIComponent(holdId)}`,
    token,
    { method: 'DELETE' },
  );
}
