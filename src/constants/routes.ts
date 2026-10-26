export type AdminSection =
  | 'overview'
  | 'workers'
  | 'businesses'
  | 'shifts'
  | 'payments'
  | 'payouts'
  | 'approvals'
  | 'support'
  | 'work-categories'
  | 'business-types'
  | 'shift-filters'
  | 'content'
  | 'marketplace'
  | 'account-deletion';

/** Route paths — use these instead of string literals. */
export const ROUTES = {
  login: '/login',
  dashboard: '/',
  liveMonitor: '/live',
  workers: '/workers',
  workerDetail: '/workers/:workerId',
  businesses: '/businesses',
  businessDetail: '/businesses/:businessId',
  verifications: '/verifications',
  shifts: '/shifts',
  shiftDetail: '/shifts/:shiftId',
  support: '/support',
  payments: '/payments',
  payouts: '/payouts',
  notifications: '/notifications',
  settings: '/settings',
  approvals: '/approvals',
  accountDeletion: '/account-deletion',
  workCategories: '/work-categories',
  businessTypes: '/business-types',
  shiftFilters: '/shift-filters',
  content: '/terms-faq',
  marketplace: '/marketplace',
} as const;

export const SECTION_ROUTES: Record<AdminSection, string> = {
  overview: ROUTES.dashboard,
  workers: ROUTES.workers,
  businesses: ROUTES.businesses,
  shifts: ROUTES.shifts,
  payments: ROUTES.payments,
  payouts: ROUTES.payouts,
  approvals: ROUTES.approvals,
  support: ROUTES.support,
  'work-categories': ROUTES.workCategories,
  'business-types': ROUTES.businessTypes,
  'shift-filters': ROUTES.shiftFilters,
  content: ROUTES.content,
  marketplace: ROUTES.marketplace,
  'account-deletion': ROUTES.accountDeletion,
};

export const ROUTE_SECTIONS: Record<string, AdminSection> = {
  [ROUTES.dashboard]: 'overview',
  [ROUTES.workers]: 'workers',
  [ROUTES.businesses]: 'businesses',
  [ROUTES.shifts]: 'shifts',
  [ROUTES.payments]: 'payments',
  [ROUTES.payouts]: 'payouts',
  [ROUTES.approvals]: 'approvals',
  [ROUTES.support]: 'support',
  [ROUTES.workCategories]: 'work-categories',
  [ROUTES.businessTypes]: 'business-types',
  [ROUTES.shiftFilters]: 'shift-filters',
  [ROUTES.content]: 'content',
  [ROUTES.marketplace]: 'marketplace',
  [ROUTES.accountDeletion]: 'account-deletion',
};
