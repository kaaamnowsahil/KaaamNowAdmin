import {
  createRecord,
  listAllRecords,
  updateRecord,
  type Numeric,
} from './adminResources';

export type CancellationPolicy = {
  id: string;
  version: number;
  is_active: boolean;
  strike_window_days: number;
  strikes_to_limit: Numeric;
  limit_days: number;
  strikes_to_ban: Numeric;
  voucher_valid_days: number;
  notes: string;
  created_at: string;
};

export type CancellationPolicyInput = Omit<CancellationPolicy, 'id' | 'created_at'>;

export type TierParty = 'worker' | 'business';
export type TierEvent = 'cancel' | 'no_show' | 'walk_off';

/** Applies when hours_from <= hours before start < hours_to (null = no upper bound). */
export type CancellationTier = {
  id: string;
  policy_version: number;
  party: TierParty;
  event: TierEvent;
  hours_from: Numeric;
  hours_to: Numeric | null;
  flat_fee_minor: number;
  booking_pct: Numeric;
  fee_cap_minor: number | null;
  worker_share_pct: Numeric;
  strike_weight: Numeric;
  business_voucher: boolean;
};

export type CancellationTierInput = Omit<CancellationTier, 'id'>;

export type PlatformFeePolicy = {
  id: string;
  version: number;
  /** Business commission %. */
  percentage: Numeric;
  worker_percentage: Numeric;
  /** Transaction (payment gateway) charge % on worker pay + commission. */
  gateway_percentage: Numeric;
  tax_percentage: Numeric;
  tax_label: string;
  tax_base: 'subtotal' | 'base_amount' | 'commission';
  is_active: boolean;
  notes: string;
  created_at: string;
};

export type PlatformFeePolicyInput = Omit<PlatformFeePolicy, 'id' | 'created_at'>;

type VersionedResource = 'cancellation_policies' | 'platform_fee_policies';

export function getCancellationPolicies(token: string): Promise<CancellationPolicy[]> {
  return listAllRecords<CancellationPolicy>(token, 'cancellation_policies', { sort: '-version' });
}

export function getCancellationTiers(token: string): Promise<CancellationTier[]> {
  return listAllRecords<CancellationTier>(token, 'cancellation_policy_tiers', {
    sort: 'policy_version',
  });
}

export function getPlatformFeePolicies(token: string): Promise<PlatformFeePolicy[]> {
  return listAllRecords<PlatformFeePolicy>(token, 'platform_fee_policies', { sort: '-version' });
}

/** Inserts the policy inactive, then its tiers; activate separately. */
export async function createCancellationPolicyVersion(
  token: string,
  policy: CancellationPolicyInput,
  tiers: Omit<CancellationTierInput, 'policy_version'>[],
): Promise<CancellationPolicy> {
  const created = await createRecord<CancellationPolicy>(token, 'cancellation_policies', {
    ...policy,
    is_active: false,
  });
  for (const tier of tiers) {
    await createRecord<CancellationTier>(token, 'cancellation_policy_tiers', {
      ...tier,
      policy_version: created.version,
    });
  }
  return created;
}

export function createPlatformFeePolicyVersion(
  token: string,
  policy: PlatformFeePolicyInput,
): Promise<PlatformFeePolicy> {
  return createRecord<PlatformFeePolicy>(token, 'platform_fee_policies', {
    ...policy,
    is_active: false,
  });
}

/**
 * Only one version may be active (partial unique index), so the current one is switched off
 * first and restored if activating the new one fails.
 */
export async function activatePolicyVersion(
  token: string,
  resource: VersionedResource,
  nextId: string,
  currentId: string | null,
): Promise<void> {
  if (currentId) await updateRecord(token, resource, currentId, { is_active: false });
  try {
    await updateRecord(token, resource, nextId, { is_active: true });
  } catch (cause) {
    if (currentId) await updateRecord(token, resource, currentId, { is_active: true }).catch(() => undefined);
    throw cause;
  }
}
