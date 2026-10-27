import { getRecord, listAllRecords } from './adminResources';
import { apiRequest } from './client';

export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketPriority = 'normal' | 'urgent';
export type TicketTopic =
  | 'general'
  | 'check_in'
  | 'payment'
  | 'payout'
  | 'shift'
  | 'account'
  | 'emergency';

export type SupportTicketRecord = {
  id: string;
  user_id: string;
  topic: TicketTopic;
  subject: string;
  message: string;
  shift_id: string | null;
  assignment_id: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  resolution_note: string | null;
  resolved_by_user_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminUserSummary = {
  id: string;
  full_name: string | null;
  phone: string;
};

export function getSupportTickets(
  token: string,
  filters: { status?: TicketStatus; priority?: TicketPriority; topic?: TicketTopic },
): Promise<SupportTicketRecord[]> {
  return listAllRecords<SupportTicketRecord>(
    token,
    'support_tickets',
    { sort: '-created_at', filters },
    500,
  );
}

/**
 * Starts or closes a ticket. The server stamps `resolved_at` and the acting admin; repeating
 * the current status returns the ticket unchanged.
 */
export function setSupportTicketStatus(
  token: string,
  id: string,
  body: { status: 'in_progress' | 'closed'; resolution_note?: string | null },
): Promise<SupportTicketRecord> {
  return apiRequest<SupportTicketRecord>(
    `/api/v1/admin/support-tickets/${encodeURIComponent(id)}/status`,
    token,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

/** Missing or unreadable users resolve to null instead of failing the whole batch. */
export async function getUserSummaries(
  token: string,
  userIds: string[],
): Promise<Map<string, AdminUserSummary>> {
  const unique = [...new Set(userIds)];
  const users = await Promise.all(
    unique.map(id => getRecord<AdminUserSummary>(token, 'users', id).catch(() => null)),
  );
  return new Map(
    users.filter((user): user is AdminUserSummary => user !== null).map(user => [user.id, user]),
  );
}
