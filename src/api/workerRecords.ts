import {
  getRecord,
  listAllRecords,
  listRecords,
  type Numeric,
} from './adminResources';

export type WorkerRestrictions = {
  id: string;
  user_id: string;
  feed_limited_until: string | null;
  banned_at: string | null;
};

export type WorkerStrike = {
  id: string;
  worker_profile_id: string;
  assignment_id: string | null;
  weight: Numeric;
  reason: string;
  expires_at: string;
  voided_at: string | null;
  voided_by_user_id: string | null;
  void_reason: string | null;
  created_at: string;
};

export type EarningLedgerEntry = {
  id: string;
  worker_profile_id: string;
  entry_type: string;
  amount_minor: number;
  currency: string;
  assignment_id: string | null;
  invoice_id: string | null;
  withdrawal_id: string | null;
  description: string;
  created_at: string;
};

type AssignmentSummary = { id: string };

export function getWorkerRestrictions(
  token: string,
  workerProfileId: string,
): Promise<WorkerRestrictions> {
  return getRecord<WorkerRestrictions>(token, 'worker_profiles', workerProfileId);
}

export function getWorkerStrikes(token: string, workerProfileId: string): Promise<WorkerStrike[]> {
  return listAllRecords<WorkerStrike>(token, 'worker_strikes', {
    sort: '-created_at',
    filters: { worker_profile_id: workerProfileId },
  });
}

/** Wallet balance is the sum of the append-only ledger, so every entry is loaded. */
export function getWorkerLedger(
  token: string,
  workerProfileId: string,
): Promise<EarningLedgerEntry[]> {
  return listAllRecords<EarningLedgerEntry>(
    token,
    'earning_ledger_entries',
    { sort: '-created_at', filters: { worker_profile_id: workerProfileId } },
    10_000,
  );
}

export async function getLatestAssignmentId(
  token: string,
  workerProfileId: string,
): Promise<string | null> {
  const page = await listRecords<AssignmentSummary>(token, 'shift_assignments', {
    limit: 1,
    sort: '-created_at',
    filters: { worker_profile_id: workerProfileId },
  });
  return page.items[0]?.id ?? null;
}
