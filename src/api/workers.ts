import { apiRequest } from './client';
import type { KycStatus, Worker } from '@/types/worker';

type WorkerProfileResponse = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  age: number | null;
  photo_url: string | null;
  phone: string;
  address_text: string;
  locality: string;
  category_slugs: string[];
  verification_status: KycStatus;
  verification_note: string | null;
  verified_at: string | null;
  is_available: boolean;
  availability_changed_at: string | null;
  rating_avg: number;
  rating_count: number;
  completed_shift_count: number;
};

type VerificationQueue = {
  workers: WorkerProfileResponse[];
};

type VerificationDecision = {
  status: KycStatus;
  note?: string;
};

const VERIFICATION_STATUSES: KycStatus[] = ['pending', 'verified', 'rejected'];
const PAGE_SIZE = 50;

function mapWorker(profile: WorkerProfileResponse): Worker {
  return {
    id: profile.id,
    userId: profile.user_id,
    isActive: false,
    name: profile.full_name,
    phone: profile.phone,
    email: profile.email,
    age: profile.age,
    photoUrl: profile.photo_url,
    address: profile.address_text,
    locality: profile.locality,
    categories: profile.category_slugs,
    rating: profile.rating_avg,
    ratingCount: profile.rating_count,
    completedShifts: profile.completed_shift_count,
    verificationStatus: profile.verification_status,
    verificationNote: profile.verification_note,
    verifiedAt: profile.verified_at,
    isAvailable: profile.is_available,
    availabilityChangedAt: profile.availability_changed_at,
  };
}

async function getWorkersByStatus(
  token: string,
  status: KycStatus,
): Promise<Worker[]> {
  const workers: Worker[] = [];
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
    workers.push(...page.workers.map(mapWorker));
    if (page.workers.length === 0) return workers;
    offset += page.workers.length;
  }
}

export async function getWorkers(token: string): Promise<Worker[]> {
  const workersByStatus = await Promise.all(
    VERIFICATION_STATUSES.map(status => getWorkersByStatus(token, status)),
  );
  return workersByStatus.flat();
}

export async function verifyWorker(
  token: string,
  workerId: string,
  status: KycStatus,
): Promise<WorkerProfileResponse> {
  return apiRequest<WorkerProfileResponse>(
    `/api/v1/admin/workers/${encodeURIComponent(workerId)}/verification`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ status } satisfies VerificationDecision),
    },
  );
}

export function mapWorkerProfile(
  profile: WorkerProfileResponse,
  isActive: boolean,
): Worker {
  return { ...mapWorker(profile), isActive };
}
