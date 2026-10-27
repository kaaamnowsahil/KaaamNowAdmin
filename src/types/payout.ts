export type PayoutMethod = 'UPI' | 'Paytm' | 'Bank' | 'Unknown';

/** `withdrawals.status`; moved only by the payout provider sync, never by the dashboard. */
export type PayoutStatus = 'initiated' | 'processing' | 'paid' | 'failed';

export type Payout = {
  id: string;
  reference: string;
  workerId: string;
  workerName: string;
  amountMinor: number;
  method: PayoutMethod;
  /** UPI id, wallet number or masked bank account. */
  destination: string;
  provider: string;
  requestedAt: string;
  completedAt: string | null;
  status: PayoutStatus;
  failureReason: string | null;
};
