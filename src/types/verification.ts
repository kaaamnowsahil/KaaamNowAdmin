import type { UserRole } from './common';

export type AdminVerificationRequest = {
  id: string;
  subject: UserRole;
  name: string;
  phone: string;
  area: string;
  imageUrl?: string | null;
  status: 'pending' | 'verified' | 'rejected';
  details: { label: string; value: string }[];
};
