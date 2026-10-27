import type { AdminShift, Payment, Payout, SupportTicket } from '@/types';
import { formatMinorRupees, initialsOf } from '@/utils/format';

/** Shifts still looking for workers. */
const STAFFING_STATUSES = new Set<AdminShift['status']>(['searching', 'open']);

export function shiftsNeedingWorkers(shifts: readonly AdminShift[]): AdminShift[] {
  return shifts.filter(
    shift => STAFFING_STATUSES.has(shift.status) && shift.assignedCount < shift.workersNeeded,
  );
}

export type ActivityItem = {
  kind: 'shift' | 'payment' | 'payout' | 'ticket';
  id: string;
  at: string;
  initials: string;
  tone: 'purple' | 'blue' | 'green' | 'orange';
  text: string;
  detail: string;
};

const label = (value: string) => value.replace(/_/g, ' ');

/** Newest real records across the loaded tables, most recent first. */
export function recentActivity(
  data: {
    shifts: readonly AdminShift[];
    payments: readonly Payment[];
    payouts: readonly Payout[];
    supportTickets: readonly SupportTicket[];
  },
  limit: number,
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...data.shifts.map(shift => ({
      kind: 'shift' as const,
      id: shift.id,
      at: shift.createdAt,
      initials: initialsOf(shift.businessName) || 'S',
      tone: 'purple' as const,
      text: `${shift.businessName} posted a ${shift.kind} shift`,
      detail: `${shift.role} · ${label(shift.status)}`,
    })),
    ...data.payments.map(payment => ({
      kind: 'payment' as const,
      id: payment.id,
      at: payment.createdAt,
      initials: '₹',
      tone: 'green' as const,
      text: `Payment of ${formatMinorRupees(payment.amountMinor)} ${label(payment.status)}`,
      detail: `${payment.reference} · ${payment.businessName}`,
    })),
    ...data.payouts.map(payout => ({
      kind: 'payout' as const,
      id: payout.id,
      at: payout.requestedAt,
      initials: initialsOf(payout.workerName) || 'W',
      tone: 'blue' as const,
      text: `Withdrawal of ${formatMinorRupees(payout.amountMinor)} ${label(payout.status)}`,
      detail: `${payout.reference} · ${payout.workerName}`,
    })),
    ...data.supportTickets.map(ticket => ({
      kind: 'ticket' as const,
      id: ticket.id,
      at: ticket.createdAt,
      initials: initialsOf(ticket.raisedBy.name) || '?',
      tone: 'orange' as const,
      text: ticket.subject,
      detail: `${ticket.raisedBy.name} · ${label(ticket.status)}`,
    })),
  ];
  return items
    .filter(item => !Number.isNaN(Date.parse(item.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}
