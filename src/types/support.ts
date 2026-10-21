import type { UserRole } from './common';

export type TicketCategory =
  | 'payment'
  | 'noShow'
  | 'dispute'
  | 'safety'
  | 'account'
  | 'other';

export type TicketPriority = 'low' | 'medium' | 'high';

export type TicketStatus = 'open' | 'inProgress' | 'resolved';

export type TicketReply = {
  id: string;
  author: 'admin' | 'user';
  message: string;
  at: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  raisedBy: { role: UserRole; id: string; name: string };
  shiftId?: string;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
};
