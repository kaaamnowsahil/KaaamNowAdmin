import { apiRequest } from './client';

export type AdminCount = { key: string; count: number };

/** `GET /api/v1/admin/metrics/overview`; money fields are paise. */
export type AdminMetricsOverview = {
  users_total: number;
  users_active: number;
  workers_total: number;
  workers_by_verification: AdminCount[];
  businesses_total: number;
  businesses_by_verification: AdminCount[];
  shifts_total: number;
  shifts_by_status: AdminCount[];
  open_support_tickets: number;
  pending_withdrawals: number;
  pending_withdrawals_minor: number;
  total_paid_out_minor: number;
  invoiced_paid_minor: number;
  platform_fees_minor: number;
  payments_succeeded_minor: number;
  currency: string;
};

export function getMetricsOverview(token: string) {
  return apiRequest<AdminMetricsOverview>('/api/v1/admin/metrics/overview', token);
}

export const countFor = (counts: readonly AdminCount[], key: string) =>
  counts.find(item => item.key === key)?.count ?? 0;
