import type {
  AdminShift,
  Payment,
  Payout,
  SupportTicket,
} from '@/types';

export const shifts: AdminShift[] = [
  { id: 'SH-7824', kind: 'live', status: 'partiallyFilled', role: 'Café service associate', category: 'hospitality', businessId: 'BZ-2081', businessName: 'Third Wave Coffee', area: 'Koramangala', date: '2026-10-20', startTime: '14:00', endTime: '18:00', hours: 4, hourlyRate: 150, workersNeeded: 3, applicants: 8, assignments: [{ workerId: 'WK-1048', workerName: 'Aarav Sharma', status: 'onTheWay' }, { workerId: 'WK-1045', workerName: 'Meera Nair', status: 'checkedIn' }], requirement: 'Customer service experience required', responsibilities: 'Welcome guests, take orders, serve food and keep the service area clean.', searchRadiusKm: 5, createdAt: '2026-10-20T12:10:00+05:30' },
  { id: 'SH-7823', kind: 'scheduled', status: 'finding', role: 'Event service associate', category: 'events', businessId: 'BZ-2080', businessName: 'The Park Events', area: 'Indiranagar', date: '2026-10-22', startTime: '10:00', endTime: '16:00', hours: 6, hourlyRate: 175, workersNeeded: 4, applicants: 0, assignments: [], requirement: 'Previous service experience preferred', responsibilities: 'Welcome guests and support the event floor.', createdAt: '2026-10-20T11:42:00+05:30' },
  { id: 'SH-7822', kind: 'scheduled', status: 'staffed', role: 'Store restock associate', category: 'retail', businessId: 'BZ-2079', businessName: 'Nature’s Basket', area: 'HSR Layout', date: '2026-10-21', startTime: '09:00', endTime: '14:00', hours: 5, hourlyRate: 140, workersNeeded: 3, applicants: 11, assignments: [{ workerId: 'WK-1047', workerName: 'Priya Patel', status: 'confirmed' }], requirement: 'Comfortable handling stock and boxes', responsibilities: 'Restock shelves, check labels, and organize inventory.', createdAt: '2026-10-19T15:00:00+05:30' },
  { id: 'SH-7821', kind: 'live', status: 'inProgress', role: 'Kitchen helper', category: 'hospitality', businessId: 'BZ-2078', businessName: 'Truffles', area: 'Jayanagar', date: '2026-10-20', startTime: '16:00', endTime: '22:00', hours: 6, hourlyRate: 160, workersNeeded: 2, applicants: 5, assignments: [{ workerId: 'WK-1043', workerName: 'Ananya Roy', status: 'checkedIn' }], requirement: 'Basic kitchen experience', responsibilities: 'Assist the kitchen team with prep and cleaning.', searchRadiusKm: 8, createdAt: '2026-10-20T14:02:00+05:30' },
  { id: 'SH-7820', kind: 'scheduled', status: 'finding', role: 'Banquet server', category: 'hospitality', businessId: 'BZ-2081', businessName: 'Third Wave Coffee', area: 'Koramangala', date: '2026-10-24', startTime: '18:00', endTime: '23:00', hours: 5, hourlyRate: 180, workersNeeded: 8, applicants: 2, assignments: [], requirement: 'Clear communication and guest service', responsibilities: 'Set up banquet tables and serve guests.', createdAt: '2026-10-20T09:52:00+05:30' },
];

export const payments: Payment[] = [
  { id: 'PAY-62180', reference: 'KN-62180', businessId: 'BZ-2081', businessName: 'Third Wave Coffee', shiftId: 'SH-7824', role: 'Café service associate', workers: 2, createdAt: '2026-10-20T14:15:00+05:30', subtotal: 1200, platformFee: 60, amount: 1260, method: 'googlePay', status: 'paid' },
  { id: 'PAY-62179', reference: 'KN-62179', businessId: 'BZ-2080', businessName: 'The Park Events', shiftId: 'SH-7819', role: 'Event floor support', workers: 4, createdAt: '2026-10-20T13:35:00+05:30', subtotal: 5600, platformFee: 280, amount: 5880, method: 'upiQr', status: 'pending' },
  { id: 'PAY-62178', reference: 'KN-62178', businessId: 'BZ-2079', businessName: 'Nature’s Basket', shiftId: 'SH-7808', role: 'Store restock associate', workers: 3, createdAt: '2026-10-19T18:40:00+05:30', subtotal: 2100, platformFee: 105, amount: 2205, method: 'cards', status: 'paid' },
  { id: 'PAY-62177', reference: 'KN-62177', businessId: 'BZ-2077', businessName: 'QuickKart', shiftId: 'SH-7804', role: 'Delivery associate', workers: 5, createdAt: '2026-10-19T17:20:00+05:30', subtotal: 4800, platformFee: 240, amount: 5040, method: 'paytm', status: 'refunded' },
  { id: 'PAY-62176', reference: 'KN-62176', businessId: 'BZ-2081', businessName: 'Third Wave Coffee', shiftId: 'SH-7798', role: 'Café service associate', workers: 2, createdAt: '2026-10-18T12:05:00+05:30', subtotal: 1200, platformFee: 60, amount: 1260, method: 'applePay', status: 'paid' },
];

export const payouts: Payout[] = [
  {
    id: 'PAYOUT-2201',
    reference: 'KD-2201',
    workerId: 'WK-1048',
    workerName: 'Aarav Sharma',
    amount: 4200,
    method: 'UPI',
    destination: 'aarav@okaxis',
    requestedAt: '2026-10-20T13:15:00+05:30',
    status: 'processing',
  },
  {
    id: 'PAYOUT-2200',
    reference: 'KD-2200',
    workerId: 'WK-1047',
    workerName: 'Priya Patel',
    amount: 2600,
    method: 'Paytm',
    destination: '+91 98765 43211',
    requestedAt: '2026-10-20T09:40:00+05:30',
    processedAt: '2026-10-20T11:15:00+05:30',
    status: 'completed',
  },
  {
    id: 'PAYOUT-2199',
    reference: 'KD-2199',
    workerId: 'WK-1045',
    workerName: 'Meera Nair',
    amount: 3500,
    method: 'Bank',
    destination: '•••• 1182',
    requestedAt: '2026-10-19T18:10:00+05:30',
    status: 'pending',
  },
];

export const supportTickets: SupportTicket[] = [
  {
    id: 'SUP-1841',
    subject: 'Payment not reflected',
    message: 'My shift payout for the café job did not reflect in my wallet yet.',
    category: 'payment',
    priority: 'high',
    status: 'open',
    raisedBy: { role: 'worker', id: 'WK-1048', name: 'Aarav Sharma' },
    shiftId: 'SH-7824',
    createdAt: '2026-10-20T10:04:00+05:30',
    updatedAt: '2026-10-20T10:04:00+05:30',
    replies: [
      {
        id: 'rep-1',
        author: 'user',
        message: 'Hi, my payout is still pending after 2 hours.',
        at: '2026-10-20T10:05:00+05:30',
      },
    ],
  },
  {
    id: 'SUP-1840',
    subject: 'No-show follow-up',
    message: 'One worker did not arrive for the event staff shift. Please confirm the resolution.',
    category: 'noShow',
    priority: 'medium',
    status: 'inProgress',
    raisedBy: { role: 'business', id: 'BZ-2080', name: 'The Park Events' },
    shiftId: 'SH-7823',
    createdAt: '2026-10-19T16:48:00+05:30',
    updatedAt: '2026-10-20T09:12:00+05:30',
    replies: [
      {
        id: 'rep-2',
        author: 'admin',
        message: 'We are reviewing the attendance logs and will update you shortly.',
        at: '2026-10-20T09:12:00+05:30',
      },
    ],
  },
];
