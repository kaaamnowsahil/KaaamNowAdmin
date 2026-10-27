export type ShiftKind = 'live' | 'scheduled';

/** `shifts.status` values from the backend. */
export type ShiftStatus =
  | 'draft'
  | 'awaiting_payment'
  | 'searching'
  | 'open'
  | 'filled'
  | 'in_progress'
  | 'completed'
  | 'expired'
  | 'cancelled';

export type AdminShift = {
  id: string;
  kind: ShiftKind;
  status: ShiftStatus;
  role: string;
  businessId: string;
  businessName: string;
  area: string;
  startsAt: string;
  endsAt: string;
  hourlyRateMinor: number;
  workersNeeded: number;
  /** Assignments that are not cancelled or no-show. */
  assignedCount: number;
  requirement: string;
  responsibilities: string;
  /** Live requests only. */
  searchRadiusKm: number | null;
  createdAt: string;
  cancelReason: string | null;
};
