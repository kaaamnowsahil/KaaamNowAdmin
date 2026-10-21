/** Same destinations the worker app offers for withdrawals. */
export type PayoutMethod = 'UPI' | 'Paytm' | 'Bank';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Payout = {
  id: string;
  reference: string;
  workerId: string;
  workerName: string;
  amount: number;
  method: PayoutMethod;
  /** UPI id, wallet number or masked bank account. */
  destination: string;
  requestedAt: string;
  processedAt?: string;
  status: PayoutStatus;
  failureReason?: string;
};
