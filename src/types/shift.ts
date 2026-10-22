export type ShiftKind = 'live' | 'scheduled';

export type ShiftStatus =
  | 'finding'
  | 'partiallyFilled'
  | 'staffed'
  | 'inProgress'
  | 'completed'
  | 'cancelled';

export type AssignmentStatus =
  | 'confirmed'
  | 'onTheWay'
  | 'checkedIn'
  | 'completed'
  | 'noShow';

export type ShiftAssignment = {
  workerId: string;
  workerName: string;
  status: AssignmentStatus;
  checkInAt?: string;
  ratingGiven?: number;
};

export type AdminShift = {
  id: string;
  kind: ShiftKind;
  status: ShiftStatus;
  role: string;
  /** Category id, e.g. "hospitality". */
  category: string;
  businessId: string;
  businessName: string;
  area: string;
  /** Local date, YYYY-MM-DD */
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  hourlyRate: number;
  workersNeeded: number;
  applicants: number;
  assignments: ShiftAssignment[];
  requirement: string;
  responsibilities: string;
  /** Live requests only. */
  searchRadiusKm?: number;
  createdAt: string;
  cancelReason?: string;
};
