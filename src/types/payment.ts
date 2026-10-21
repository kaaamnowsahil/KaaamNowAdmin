/** Same methods the business app offers at checkout. */
export type PaymentMethod =
  | 'googlePay'
  | 'paytm'
  | 'applePay'
  | 'upiQr'
  | 'cards';

export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed';

export type Payment = {
  id: string;
  reference: string;
  businessId: string;
  businessName: string;
  shiftId: string;
  role: string;
  workers: number;
  createdAt: string;
  subtotal: number;
  platformFee: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
};
