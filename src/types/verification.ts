import type { UserRole } from './common';

export type DocumentType = 'aadhaar' | 'pan' | 'selfie' | 'gst' | 'shopLicense';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type VerificationRequest = {
  id: string;
  subject: UserRole;
  subjectId: string;
  name: string;
  phone: string;
  area: string;
  submittedAt: string;
  documents: { type: DocumentType; number: string }[];
  status: VerificationStatus;
  reviewedAt?: string;
  rejectionReason?: string;
};
