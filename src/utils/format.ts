/** +919876543210 -> "+91 ***** 43210" */
export const maskIndianPhone = (e164: string): string => {
  const local = e164.replace(/^\+91/, '');
  return `+91 ***** ${local.slice(-5)}`;
};

/** +919876543210 -> "+91 98765 43210" */
export const formatIndianPhone = (e164: string): string => {
  const local = e164.replace(/^\+91/, '');
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
};

/** 1050 -> "₹1,050" */
export const formatRupees = (amount: number): string =>
  `₹${Math.round(amount).toLocaleString('en-IN')}`;

/** 125000 -> "₹1.3L", 2400000 -> "₹24L" */
export const formatCompactRupees = (amount: number): string => {
  if (amount >= 1_00_00_000) {
    return `₹${(amount / 1_00_00_000).toFixed(1).replace(/\.0$/, '')}Cr`;
  }
  if (amount >= 1_00_000) {
    return `₹${(amount / 1_00_000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (amount >= 1_000) {
    return `₹${(amount / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return formatRupees(amount);
};

/** 1234 -> "1,234" */
export const formatCount = (value: number): string =>
  value.toLocaleString('en-IN');

/** "Aarav Sharma" → "AS" (first two words). */
export const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

/** Fee on a subtotal, rounded like the app's checkout. */
export const platformFeeOf = (subtotal: number, feePercent: number) =>
  Math.round((subtotal * feePercent) / 100);
