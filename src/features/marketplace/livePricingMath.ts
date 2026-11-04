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
  subtotal: 'Base amount + platform charge (subtotal)',
  base_amount: 'Base amount only',
  commission: 'Platform charge only',
};

/** Search + retry limits, same as the server. */
export const SEARCH_RULE_LIMITS = {
  search_timeout_minutes: [5, 120],
  max_search_rounds: [1, 5],
  retry_choice_minutes: [2, 60],
} as const;
export const MAX_BOOST_OPTIONS = 5;
export const BOOST_RUPEES_RANGE = [1, 1000] as const;

/** Returns an error message, or '' when the value is a whole number from min to max. */
export function wholeNumberError(value: string, min: number, max: number): string {
  const text = value.trim();
  if (!text) return 'Required.';
  if (!/^\d+$/.test(text)) return 'Enter a whole number.';
  const n = Number(text);
  if (n < min || n > max) return `Must be between ${min} and ${max}.`;
  return '';
}

/** "10, 20, 30" (rupees) → [1000, 2000, 3000] (paise, sorted), or an error message. */
export function parseBoostRupees(value: string): { minor: number[]; error: string } {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  const [low, high] = BOOST_RUPEES_RANGE;
  if (!parts.length || parts.length > MAX_BOOST_OPTIONS) {
    return { minor: [], error: `Give 1 to ${MAX_BOOST_OPTIONS} amounts, separated by commas.` };
  }
  if (parts.some((part) => !/^\d+$/.test(part) || Number(part) < low || Number(part) > high)) {
    return { minor: [], error: `Each amount must be whole rupees from ₹${low} to ₹${high.toLocaleString('en-IN')}.` };
  }
  const rupees = parts.map(Number);
  if (new Set(rupees).size !== rupees.length) return { minor: [], error: 'Each amount can appear only once.' };
  return { minor: rupees.map((r) => r * 100).sort((a, b) => a - b), error: '' };
}
