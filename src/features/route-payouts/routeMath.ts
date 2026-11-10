import type { RoutePayment, TransferAction, TransferStatus } from '@/api/routePayouts';

export type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'blue';

/** "123.45" rupees → 12345 paise. Null for anything that is not a positive amount with ≤ 2 decimals. */
export function rupeesToMinor(text: string): number | null {
  const value = text.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

/** What is still refundable on a captured payment. Money already in Workers' accounts needs a reversal. */
export function refundable(payment: Pick<RoutePayment, 'amount_minor' | 'refunded_minor' | 'transferred_minor'>) {
  const left = Math.max(0, payment.amount_minor - payment.refunded_minor);
  const withoutReversal = Math.max(0, left - payment.transferred_minor);
  return { left, withoutReversal };
}

/** Admin actions per transfer status; the server enforces the same rules. */
export function transferActions(status: TransferStatus): TransferAction[] {
  switch (status) {
    case 'pending':
      return ['approve', 'release'];
    case 'processing':
    case 'processed':
      return ['sync'];
    case 'failed':
      return ['retry', 'release', 'sync'];
    default:
      return [];
  }
}

const TONES: Record<string, Tone> = {
  processed: 'success',
  activated: 'success',
  captured: 'success',
  resolved: 'success',
  pending: 'warning',
  requested: 'warning',
  approved: 'blue',
  processing: 'blue',
  under_review: 'blue',
  created: 'neutral',
  not_eligible: 'neutral',
  not_started: 'neutral',
  needs_clarification: 'warning',
  partially_refunded: 'purple',
  refunded: 'purple',
  reversed: 'purple',
  open: 'danger',
  failed: 'danger',
  rejected: 'danger',
  suspended: 'danger',
};

export const statusTone = (status: string | null | undefined): Tone =>
  (status && TONES[status]) || 'neutral';

export const statusLabel = (status: string | null | undefined) =>
  status ? status.replace(/_/g, ' ') : '—';
