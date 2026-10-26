import { createRecord, listAllRecords, updateRecord, type Numeric } from './adminResources';

export type PromoCode = {
  id: string;
  code: string;
  target_role: 'worker' | 'business';
  discount_type: 'flat' | 'percent' | 'waive_fees';
  discount_value: Numeric;
  applies_to: 'commission' | 'gateway' | 'all_fees';
  max_discount_minor: number | null;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  max_uses_per_user: number;
  used_count: number;
  owner_user_id: string | null;
  source: 'admin' | 'system';
  is_active: boolean;
  created_at: string;
};

export type PromoCodeInput = Pick<
  PromoCode,
  | 'code'
  | 'target_role'
  | 'discount_type'
  | 'discount_value'
  | 'applies_to'
  | 'max_discount_minor'
  | 'valid_until'
  | 'max_uses'
  | 'max_uses_per_user'
>;

export type TermsAcceptance = {
  id: string;
  user_id: string;
  audience: 'worker' | 'business';
  version: string;
  ip_address: string | null;
  user_agent: string | null;
  accepted_at: string;
};

export function getPromoCodes(token: string) {
  return listAllRecords<PromoCode>(token, 'promo_codes', { sort: '-created_at' });
}

export function createPromoCode(token: string, body: PromoCodeInput) {
  return createRecord<PromoCode>(token, 'promo_codes', { ...body, source: 'admin', is_active: true });
}

export function setPromoCodeActive(token: string, id: string, isActive: boolean) {
  return updateRecord<PromoCode>(token, 'promo_codes', id, { is_active: isActive });
}

export function getTermsAcceptances(token: string) {
  return listAllRecords<TermsAcceptance>(token, 'terms_acceptances', { sort: '-accepted_at' }, 500);
}
