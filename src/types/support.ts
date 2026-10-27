import type {
  TicketPriority,
  TicketStatus,
  TicketTopic,
} from '@/api/supportTickets';

export type { TicketPriority, TicketStatus, TicketTopic };

export type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  topic: TicketTopic;
  priority: TicketPriority;
  status: TicketStatus;
  raisedBy: { id: string; name: string; phone: string | null };
  shiftId: string | null;
  assignmentId: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
};
