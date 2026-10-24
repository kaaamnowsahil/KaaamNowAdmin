export type KycStatus = 'verified' | 'pending' | 'rejected';

export type Worker = {
  id: string;
  userId: string;
  isActive: boolean;
  name: string;
  phone: string;
  email: string | null;
  age: number | null;
  photoUrl: string | null;
  address: string;
  locality: string;
  categories: string[];
  rating: number;
  ratingCount: number;
  completedShifts: number;
  verificationStatus: KycStatus;
  verificationNote: string | null;
  verifiedAt: string | null;
  isAvailable: boolean;
  availabilityChangedAt: string | null;
};
