import { describe, expect, it } from 'vitest';

import type { AdminShift, Payment, Payout, SupportTicket } from '@/types';
import { formatMinorRupees } from '@/utils/format';
import { recentActivity, shiftsNeedingWorkers } from './overviewLogic';

const shift = (over: Partial<AdminShift>): AdminShift => ({
  id: 's',
  kind: 'live',
  status: 'searching',
  role: 'Helper',
  businessId: 'b',
  businessName: 'Cafe One',
  area: 'HSR',
  startsAt: '2026-10-27T10:00:00Z',
  endsAt: '2026-10-27T14:00:00Z',
  hourlyRateMinor: 20000,
  pricingMode: 'hourly',
  taskPriceMinor: null,
  workersNeeded: 2,
  assignedCount: 0,
  requirement: '',
  responsibilities: '',
  searchRadiusKm: 3,
  createdAt: '2026-10-27T08:00:00Z',
  cancelReason: null,
  ...over,
});

describe('shiftsNeedingWorkers', () => {
  it('counts only open or searching shifts with free seats', () => {
    const result = shiftsNeedingWorkers([
      shift({ id: 'a' }),
      shift({ id: 'b', status: 'open', assignedCount: 1 }),
      shift({ id: 'c', assignedCount: 2 }),
      shift({ id: 'd', status: 'completed' }),
      shift({ id: 'e', status: 'cancelled' }),
    ]);
    expect(result.map(item => item.id)).toEqual(['a', 'b']);
  });
});

describe('recentActivity', () => {
  it('merges real records newest first and drops invalid dates', () => {
    const items = recentActivity(
      {
        shifts: [shift({ id: 's1', createdAt: '2026-10-27T08:00:00Z' }), shift({ id: 'bad', createdAt: 'nope' })],
        payments: [{ id: 'p1', createdAt: '2026-10-27T09:00:00Z', amountMinor: 50050, status: 'succeeded', reference: 'PAY-1', businessName: 'Cafe One' } as Payment],
        payouts: [{ id: 'w1', requestedAt: '2026-10-27T07:00:00Z', amountMinor: 10000, status: 'processing', reference: 'WD-1', workerName: 'Asha K' } as Payout],
        supportTickets: [{ id: 't1', createdAt: '2026-10-27T10:00:00Z', subject: 'Help', status: 'in_progress', raisedBy: { id: 'u', name: 'Ravi', phone: null } } as SupportTicket],
      },
      3,
    );
    expect(items.map(item => item.id)).toEqual(['t1', 'p1', 's1']);
    expect(items[0]?.detail).toBe('Ravi · in progress');
    expect(items[1]?.text).toBe(`Payment of ${formatMinorRupees(50050)} succeeded`);
    expect(items[2]?.text).toBe('Cafe One posted a live shift');
  });

  it('returns nothing when no records exist', () => {
    expect(recentActivity({ shifts: [], payments: [], payouts: [], supportTickets: [] }, 5)).toEqual([]);
  });

  it('uses fallback initials for blank names', () => {
    const [item] = recentActivity(
      {
        shifts: [],
        payments: [],
        payouts: [{ id: 'w', requestedAt: '2026-10-27T07:00:00Z', amountMinor: 1, status: 'paid', reference: 'R', workerName: '' } as Payout],
        supportTickets: [],
      },
      1,
    );
    expect(item?.initials).toBe('W');
  });
});

describe('formatMinorRupees', () => {
  it('keeps paise only when present', () => {
    expect(formatMinorRupees(105000)).toBe('₹1,050');
    expect(formatMinorRupees(105050)).toBe('₹1,050.50');
  });
});
