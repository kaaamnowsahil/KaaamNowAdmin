import type { PayoutStatus } from '@/types';

import { apiRequest } from './client';

export type ManualPayoutResult = {
  id: string;
  status: PayoutStatus;
  failure_reason: string | null;
  payout_utr: string | null;
  proof_url: string | null;
  completed_at: string | null;
};

/** Records a manual payout: the payment screenshot is required, the UTR is optional. */
export function markWithdrawalPaid(
  token: string,
  withdrawalId: string,
  proof: File,
  utr: string,
): Promise<ManualPayoutResult> {
  const body = new FormData();
  body.append('proof', proof);
  if (utr.trim()) body.append('utr', utr.trim());
  return apiRequest<ManualPayoutResult>(
    `/api/v1/admin/withdrawals/${encodeURIComponent(withdrawalId)}/mark-paid`,
    token,
    { method: 'POST', body },
  );
}

/** Rejects a manual withdrawal; the amount goes back to the worker's balance. */
export function rejectWithdrawal(
  token: string,
  withdrawalId: string,
  reason: string,
): Promise<ManualPayoutResult> {
  return apiRequest<ManualPayoutResult>(
    `/api/v1/admin/withdrawals/${encodeURIComponent(withdrawalId)}/reject`,
    token,
    { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) },
  );
}
