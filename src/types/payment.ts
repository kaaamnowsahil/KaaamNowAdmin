/** `payments.method` values from the backend. */
export type PaymentMethod = 'google_pay' | 'paytm' | 'apple_pay' | 'upi_qr' | 'card_netbanking';

/** `payments.status` values; only the provider-confirmed flow sets `succeeded`. */
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'expired' | 'cancelled';

export type Payment = {
  id: string;
  reference: string;
  businessId: string;
  businessName: string;
  invoiceId: string;
  invoiceReference: string | null;
  /** From the linked invoice; null when the invoice could not be read. */
  subtotalMinor: number | null;
  platformFeeMinor: number | null;
  amountMinor: number;
  method: PaymentMethod;
  provider: string;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
  failureReason: string | null;
};
