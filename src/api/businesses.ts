import { apiRequest } from './client';
import type { Business, BusinessVerificationStatus } from '@/types/business';

type BusinessProfileResponse = {
  id: string;
  user_id: string;
  business_name: string;
  category_slug: string | null;
  category_name: string | null;
  logo_url: string | null;
  address_text: string;
  locality: string;
  verification_status: BusinessVerificationStatus;
  verification_note: string | null;
  verified_at: string | null;
  rating_avg: number;
  rating_count: number;
  owner_name: string;
  contact_name: string;
  email: string | null;
  business_type_slugs: string[];
  business_type_names: string[];
  phone: string;
};

type VerificationQueue = {
  businesses: BusinessProfileResponse[];
};

type VerificationDecision = {
  status: BusinessVerificationStatus;
  note?: string;
};

const VERIFICATION_STATUSES: BusinessVerificationStatus[] = [
  'pending',
  'verified',
  'rejected',
];
const PAGE_SIZE = 50;

function mapBusiness(profile: BusinessProfileResponse): Business {
  return {
    id: profile.id,
    userId: profile.user_id,
    isActive: false,
    name: profile.business_name,
    ownerName: profile.owner_name,
    contactName: profile.contact_name,
    phone: profile.phone,
    email: profile.email,
    logoUrl: profile.logo_url,
    category: profile.category_name ?? profile.category_slug,
    businessTypes:
      profile.business_type_names.length > 0
        ? profile.business_type_names
        : profile.business_type_slugs,
    address: profile.address_text,
    locality: profile.locality,
    verificationStatus: profile.verification_status,
    verificationNote: profile.verification_note,
    verifiedAt: profile.verified_at,
    rating: profile.rating_avg,
    ratingCount: profile.rating_count,
  };
}

async function getBusinessesByStatus(
  token: string,
  status: BusinessVerificationStatus,
): Promise<Business[]> {
  const businesses: Business[] = [];
  let offset = 0;

  while (true) {
    const query = new URLSearchParams({
      status,
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    const page = await apiRequest<VerificationQueue>(
      `/api/v1/admin/verifications?${query.toString()}`,
      token,
    );
    businesses.push(...page.businesses.map(mapBusiness));
    if (page.businesses.length === 0) return businesses;
    offset += page.businesses.length;
  }
}

export async function getBusinesses(token: string): Promise<Business[]> {
  const businessesByStatus = await Promise.all(
    VERIFICATION_STATUSES.map(status => getBusinessesByStatus(token, status)),
  );
  return businessesByStatus.flat();
}

export async function verifyBusiness(
  token: string,
  businessId: string,
  status: BusinessVerificationStatus,
): Promise<BusinessProfileResponse> {
  return apiRequest<BusinessProfileResponse>(
    `/api/v1/admin/businesses/${encodeURIComponent(businessId)}/verification`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ status } satisfies VerificationDecision),
    },
  );
}

export function mapBusinessProfile(
  profile: BusinessProfileResponse,
  isActive: boolean,
): Business {
  return { ...mapBusiness(profile), isActive };
}
