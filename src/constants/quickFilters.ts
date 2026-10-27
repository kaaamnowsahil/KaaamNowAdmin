import type { AdminSection } from './routes';

export const ALL_STATUSES = 'All statuses';

export type QuickFilter = { label: string; status: string };

/** Status presets per list page; `status` matches the badge text shown in that table. */
const QUICK_FILTERS: Partial<Record<AdminSection, QuickFilter[]>> = {
  workers: [
    { label: 'Verification pending', status: 'Pending' },
    { label: 'Rejected', status: 'Rejected' },
    { label: 'Verified', status: 'Verified' },
  ],
  businesses: [
    { label: 'Verification pending', status: 'Pending' },
    { label: 'Rejected', status: 'Rejected' },
    { label: 'Verified', status: 'Verified' },
  ],
  shifts: [
    { label: 'Finding workers', status: 'Searching' },
    { label: 'Awaiting payment', status: 'Awaiting Payment' },
    { label: 'In progress', status: 'In Progress' },
    { label: 'Completed', status: 'Completed' },
  ],
  payments: [
    { label: 'Pending', status: 'Pending' },
    { label: 'Failed', status: 'Failed' },
    { label: 'Succeeded', status: 'Succeeded' },
  ],
  payouts: [
    { label: 'Initiated', status: 'Initiated' },
    { label: 'Processing', status: 'Processing' },
    { label: 'Failed', status: 'Failed' },
    { label: 'Paid', status: 'Paid' },
  ],
  support: [
    { label: 'Open', status: 'Open' },
    { label: 'In progress', status: 'In Progress' },
    { label: 'Closed', status: 'Closed' },
  ],
};

export function quickFiltersFor(section: AdminSection): QuickFilter[] {
  return QUICK_FILTERS[section] ?? [];
}

/** Sections whose table consumes the top-bar search and status filter. */
export function sectionSupportsSearch(section: AdminSection): boolean {
  return section in QUICK_FILTERS || section === 'approvals';
}

/** True when the event is the platform "focus search" shortcut (⌘K on Apple, Ctrl+K elsewhere). */
export function isSearchShortcut(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>,
  isApple: boolean,
): boolean {
  if (event.key.toLowerCase() !== 'k' || event.altKey || event.shiftKey) return false;
  return isApple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
}

export function isApplePlatform(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}
