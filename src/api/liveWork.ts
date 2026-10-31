import { apiRequest } from './client';

const BASE = '/api/v1/admin/live-work';

export type TaxBase = 'subtotal' | 'base_amount' | 'commission';

/** Task: one fixed price, no timer or extensions; finished with the completion code. */
export type PricingMode = 'hourly' | 'task';

export type LivePriceBreakdown = {
  currency: string;
  settings_version: number;
  pricing_mode: PricingMode;
  task_price_minor: number | null;
  hourly_rate_minor: number;
  reserved_minutes: number;
  base_amount_minor: number;
  commission_pct: number;
  commission_minor: number;
  tax_label: string;
  tax_pct: number;
  tax_base: TaxBase;
  tax_base_description: string;
  taxable_minor: number;
  tax_minor: number;
  total_minor: number;
  worker_commission_minor: number;
  worker_net_minor: number;
  extension_surcharge_pct: number;
  extension_rate_minor: number;
  /** Prices above are per Worker. */
  workers_required?: number;
  booking_total_minor?: number;
};

export type LivePricingSettings = {
  version: number;
  commission_pct: number;
  tax_pct: number;
  tax_label: string;
  tax_base: TaxBase;
  tax_base_description: string;
  extension_surcharge_pct: number;
  effective_from: string;
  changed_by_label: string;
  notes: string;
  example: LivePriceBreakdown;
};

export type LivePricingSettingsInput = {
  commission_pct: string;
  tax_pct: string;
  tax_label: string;
  tax_base: TaxBase;
  extension_surcharge_pct: string;
  notes: string;
};

export type LivePricingAuditItem = {
  id: string;
  settings_version: number;
  field: string;
  old_value: string | null;
  new_value: string;
  changed_by_user_id: string | null;
  changed_by_label: string;
  request_id: string | null;
  changed_at: string;
};

export type AdminLiveBooking = {
  booking_id: string;
  shift_status: string;
  job_title: string;
  category_name: string | null;
  business_name: string;
  worker_name: string | null;
  assignment_status: string | null;
  workers_required?: number;
  workers_filled?: number;
  pricing_mode: PricingMode;
  task_price_minor: number | null;
  reserved_minutes: number;
  total_minor: number;
  commission_minor: number;
  tax_minor: number;
  refunded_minor: number;
  open_refunds: number;
  currency: string;
  created_at: string;
};

export type AdminLiveRefund = {
  id: string;
  booking_id: string;
  job_title: string;
  amount_minor: number;
  currency: string;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  provider: string;
  provider_refund_id: string | null;
  failure_reason: string | null;
  attempts: number;
  created_at: string;
  processed_at: string | null;
};

export type AdminLiveExtension = {
  id: string;
  status: string;
  extra_minutes: number;
  surcharge_pct: number;
  extension_rate_minor: number;
  base_amount_minor: number;
  commission_minor: number;
  tax_minor: number;
  total_minor: number;
  requested_at: string;
};

export type AdminLiveBookingDetail = {
  booking: AdminLiveBooking;
  pricing: LivePriceBreakdown;
  work_address: string;
  assignment_status: string | null;
  extensions: AdminLiveExtension[];
  invoices: {
    id: string;
    invoice_kind: string;
    status: string;
    total_minor: number;
    amount_due_minor: number;
    refund_due_minor: number;
    paid_at: string | null;
  }[];
  refunds: AdminLiveRefund[];
  cancellations: {
    party: string;
    event: string;
    fee_minor: number;
    worker_compensation_minor: number;
    business_refund_minor: number;
    business_retained_minor: number;
    strike_weight: number;
    created_at: string;
  }[];
};

type Page<T> = { items: T[]; total: number; limit: number; offset: number };

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
};

export const getLivePricing = (token: string) =>
  apiRequest<LivePricingSettings>(`${BASE}/pricing`, token);

export const updateLivePricing = (token: string, body: LivePricingSettingsInput) =>
  apiRequest<LivePricingSettings>(`${BASE}/pricing`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

export const getLivePricingAudit = (token: string, offset = 0, limit = 50) =>
  apiRequest<Page<LivePricingAuditItem>>(`${BASE}/pricing/audit${query({ limit, offset })}`, token);

export const getLiveBookings = (token: string, status?: string, offset = 0, limit = 50) =>
  apiRequest<Page<AdminLiveBooking>>(`${BASE}/bookings${query({ status, limit, offset })}`, token);

export const getLiveBooking = (token: string, bookingId: string) =>
  apiRequest<AdminLiveBookingDetail>(`${BASE}/bookings/${bookingId}`, token);

export const getLiveRefunds = (token: string, status?: string, offset = 0, limit = 50) =>
  apiRequest<Page<AdminLiveRefund>>(`${BASE}/refunds${query({ status, limit, offset })}`, token);

export const retryLiveRefund = (token: string, refundId: string) =>
  apiRequest<AdminLiveRefund>(`${BASE}/refunds/${refundId}/retry`, token, { method: 'POST' });
