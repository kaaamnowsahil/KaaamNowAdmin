import type { AccountStatus } from './common';

export type Business = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  /** Business type id, e.g. "cafe", "events". */
  businessType: string;
  address: string;
  area: string;
  city: string;
  gstin?: string;
  isVerified: boolean;
  status: AccountStatus;
  rating: number;
  shiftsPosted: number;
  totalSpend: number;
  outstanding: number;
  joinedAt: string;
};
