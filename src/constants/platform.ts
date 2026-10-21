/** Defaults that match the app's pricing rules; editable at runtime from Settings. */
export const PLATFORM_DEFAULTS = {
  platformFeePercent: 5,
  minHourlyRate: 130,
  defaultSearchRadiusKm: 3,
  maxSearchRadiusKm: 10,
  checkInWindowMinutes: 15,
  selectionConfirmHours: 6,
} as const;

export const PAGE_SIZE = 8;
