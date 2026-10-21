/** Route paths — use these instead of string literals. */
export const ROUTES = {
  // before login
  login: '/login',

  // after login
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
} as const;
