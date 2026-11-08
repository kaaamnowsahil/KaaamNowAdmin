export type PayoutMethod = 'UPI' | 'Paytm' | 'Bank' | 'Unknown';

/** `withdrawals.status`. Provider payouts move by the payout sync; manual ones by an admin. */
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
  /** Full details to pay a manual withdrawal to; only filled while it is waiting. */
  payTo: { label: string; value: string }[];
  /** Worker's UPI QR screenshot to scan, while a manual withdrawal is waiting. */
  payQrUrl: string | null;
  provider: string;
  requestedAt: string;
  completedAt: string | null;
  status: PayoutStatus;
  failureReason: string | null;
  utr: string | null;
  proofUrl: string | null;
};
