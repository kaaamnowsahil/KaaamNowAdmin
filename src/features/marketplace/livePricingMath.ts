export type TaxBase = 'subtotal' | 'base_amount' | 'commission';

/** Same integer rules as the server: amounts in paise, percentages with ≤2 decimals, half-up. */
const basisPoints = (pct: number) => Math.round(pct * 100);
export const pctOf = (amountMinor: number, pct: number) =>
  Math.floor((2 * amountMinor * basisPoints(pct) + 10_000) / 20_000);

export const PCT_PATTERN = /^\d{1,3}(\.\d{1,2})?$/;

/** Returns an error message, or '' when the value is a valid 0–100 percentage with ≤2 decimals. */
export function percentError(value: string): string {
  const text = value.trim();
  if (!text) return 'Required.';
  if (!PCT_PATTERN.test(text)) return 'Enter a number with up to 2 decimals.';
  const n = Number(text);
  if (n < 0 || n > 100) return 'Must be between 0 and 100.';
  return '';
}

export type PreviewInput = {
  commissionPct: number;
  taxPct: number;
  taxBase: TaxBase;
  surchargePct: number;
  hourlyRateMinor: number;
  minutes: number;
};

export function previewPrice(input: PreviewInput) {
  const base = Math.floor((2 * input.hourlyRateMinor * input.minutes + 60) / 120);
  const commission = pctOf(base, input.commissionPct);
  const taxable =
    input.taxBase === 'base_amount' ? base : input.taxBase === 'commission' ? commission : base + commission;
  const tax = pctOf(taxable, input.taxPct);
  return {
    base,
    commission,
    taxable,
    tax,
    total: base + commission + tax,
    workerNet: base - commission,
    extensionRate: input.hourlyRateMinor + pctOf(input.hourlyRateMinor, input.surchargePct),
  };
}

export const TAX_BASE_LABEL: Record<TaxBase, string> = {
  subtotal: 'Base amount + commission (subtotal)',
  base_amount: 'Base amount only',
  commission: 'Commission only',
};
