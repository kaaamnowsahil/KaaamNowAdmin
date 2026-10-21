import type { AccountStatus } from './common';
import type { PayoutMethod } from './payout';

export type KycStatus = 'verified' | 'pending' | 'rejected';

export type Worker = {
  id: string;
  name: string;
  /** E.164, e.g. +919876543210 */
  phone: string;
  email?: string;
  age: number;
  area: string;
  city: string;
  /** Category ids, e.g. "hospitality", "retail". */
  workTypes: string[];
  rating: number;
  completedShifts: number;
  noShows: number;
  totalEarnings: number;
  walletBalance: number;
  status: AccountStatus;
  kycStatus: KycStatus;
  joinedAt: string;
  lastActiveAt: string;
  payout: { method: PayoutMethod; destination: string };
};
