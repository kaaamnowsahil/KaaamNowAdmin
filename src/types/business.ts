export type BusinessVerificationStatus = 'verified' | 'pending' | 'rejected';

export type Business = {
  id: string;
  userId: string;
  isActive: boolean;
  name: string;
  ownerName: string;
  contactName: string;
  phone: string;
  email: string | null;
  logoUrl: string | null;
  category: string | null;
  businessTypes: string[];
  address: string;
  locality: string;
  verificationStatus: BusinessVerificationStatus;
  verificationNote: string | null;
  verifiedAt: string | null;
  rating: number;
  ratingCount: number;
};
