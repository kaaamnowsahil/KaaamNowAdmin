import { describe, expect, it } from 'vitest';

import { isShiftCoupon } from '@/api/promoCodes';

import { buildPromoInput, type PromoForm } from './PromoCodesTab';
import { validateShiftRates } from './ShiftPricingTab';
import { previewShiftCharge } from './shiftPricingMath';

// Same fixtures as KaaamNowBackend tests/unit/test_shift_pricing.py.
describe('previewShiftCharge', () => {
  const rates = { businessPct: 4, workerPct: 4, gatewayPct: 2, taxPct: 0, taxBase: 'subtotal' as const };

  it('matches the backend for ₹800 at 4% / 4% / 2%', () => {
    const charge = previewShiftCharge(80_000, rates);
    expect(charge.commission).toBe(3_200);
    expect(charge.gateway).toBe(1_664);
    expect(charge.tax).toBe(0);
    expect(charge.businessTotal).toBe(84_864);
    expect(charge.workerFee).toBe(3_200);
    expect(charge.workerNet).toBe(76_800);
    expect(charge.platformEarns).toBe(6_400);
  });

  it('adds tax on pay + commission by default', () => {
    const charge = previewShiftCharge(80_000, { ...rates, taxPct: 2 });
    expect(charge.taxable).toBe(83_200);
    expect(charge.tax).toBe(1_664);
    expect(charge.businessTotal).toBe(84_864 + 1_664);
  });

  it('can tax only the commission', () => {
    expect(previewShiftCharge(80_000, { ...rates, taxPct: 18, taxBase: 'commission' }).tax).toBe(576);
  });
});

describe('validateShiftRates', () => {
  const valid = {
    percentage: '4',
    worker_percentage: '4',
    gateway_percentage: '2',
    tax_percentage: '0',
    tax_label: 'GST',
    tax_base: 'subtotal' as const,
    notes: 'Festival pricing',
  };

  it('accepts a complete form', () => {
    expect(validateShiftRates(valid)).toEqual({});
  });

  it('rejects bad percentages, missing label and missing reason', () => {
    const errors = validateShiftRates({ ...valid, gateway_percentage: '120', tax_label: ' ', notes: '' });
    expect(Object.keys(errors).sort()).toEqual(['gateway_percentage', 'notes', 'tax_label']);
  });
});

describe('Shift coupons', () => {
  const form: PromoForm = {
    code: ' shift50 ',
    title: '50% off commission',
    target_role: 'business',
    booking_types: 'shift',
    discount_type: 'percent',
    discount_value: '50',
    applies_to: 'commission',
    max_discount_minor: null,
    min_booking_minor: null,
    valid_until: null,
    max_uses: 100,
    max_uses_per_user: 1,
    is_listed: true,
    capRupees: '250',
    minRupees: '500',
  };

  it('builds a Shift-scoped request in paise', () => {
    expect(buildPromoInput(form)).toMatchObject({
      code: 'SHIFT50',
      booking_types: 'shift',
      discount_value: 50,
      max_discount_minor: 25_000,
      min_booking_minor: 50_000,
      is_listed: true,
    });
  });

  it('drops booking targeting for worker payout codes', () => {
    expect(buildPromoInput({ ...form, target_role: 'worker' })).toMatchObject({
      booking_types: 'all',
      min_booking_minor: null,
      is_listed: false,
    });
  });

  it('lists only Business coupons usable on Shifts', () => {
    expect(isShiftCoupon({ target_role: 'business', booking_types: 'shift' })).toBe(true);
    expect(isShiftCoupon({ target_role: 'business', booking_types: 'all' })).toBe(true);
    expect(isShiftCoupon({ target_role: 'business', booking_types: 'live' })).toBe(false);
    expect(isShiftCoupon({ target_role: 'worker', booking_types: 'all' })).toBe(false);
  });
});
