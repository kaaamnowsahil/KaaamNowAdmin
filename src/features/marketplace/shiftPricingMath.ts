import { pctOf, type TaxBase } from './livePricingMath';

export type ShiftRatesInput = {
  businessPct: number;
  workerPct: number;
  gatewayPct: number;
  taxPct: number;
  taxBase: TaxBase;
};

/**
 * Mirrors the server's Shift charge (``pricing_engine.compute_charge`` without a coupon):
 * commission on worker pay, transaction charge on pay + commission, tax on the chosen base,
 * worker commission deducted from the worker's pay. All amounts in paise, half-up rounding.
 */
export function previewShiftCharge(workerPayMinor: number, rates: ShiftRatesInput) {
  const base = workerPayMinor;
  const commission = pctOf(base, rates.businessPct);
  const gateway = pctOf(base + commission, rates.gatewayPct);
  const taxable =
    rates.taxBase === 'base_amount' ? base : rates.taxBase === 'commission' ? commission : base + commission;
  const tax = pctOf(taxable, rates.taxPct);
  const workerFee = pctOf(base, rates.workerPct);
  return {
    base,
    commission,
    gateway,
    taxable,
    tax,
    businessTotal: base + commission + gateway + tax,
    workerFee,
    workerNet: base - workerFee,
    platformEarns: commission + workerFee,
  };
}
