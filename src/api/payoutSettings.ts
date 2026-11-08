import { createRecord, listRecords, updateRecord } from './adminResources';
import { apiRequest } from './client';

export type EffectivePayoutSettings = {
  /** Smallest amount (paise) a Worker can withdraw. */
  min_withdrawal_minor: number;
  source: 'admin' | 'default';
};

const RESOURCE = 'payout_settings';

/** Withdrawal rules in effect now (admin row, or the server's configured default). */
export function getEffectivePayoutSettings(token: string) {
  return apiRequest<EffectivePayoutSettings>('/api/v1/admin/settings/payouts', token);
}

/** One settings row: updated in place once it exists; every save is audited. */
export async function saveMinWithdrawal(token: string, minWithdrawalMinor: number, notes: string) {
  const existing = (await listRecords<{ id: string }>(token, RESOURCE, { limit: 1 })).items[0];
  const body = { min_withdrawal_minor: minWithdrawalMinor, notes };
  return existing
    ? updateRecord(token, RESOURCE, existing.id, body)
    : createRecord(token, RESOURCE, body);
}
