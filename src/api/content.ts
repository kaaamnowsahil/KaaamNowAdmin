import { apiRequest } from './client';

export type ContentAudience = 'worker' | 'business' | 'all';

export type Faq = {
  id: string;
  audience: ContentAudience;
  slug: string | null;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FaqInput = Pick<
  Faq,
  'audience' | 'slug' | 'question' | 'answer' | 'sort_order' | 'is_active'
>;

export type Terms = {
  id: string;
  audience: ContentAudience;
  title: string;
  body_markdown: string;
  effective_date: string;
  created_at: string;
  updated_at: string;
};

export type TermsInput = Pick<Terms, 'title' | 'body_markdown' | 'effective_date'>;

const FAQS_URL = '/api/v1/admin/faqs';
const TERMS_URL = '/api/v1/admin/terms';

export function getFaqs(token: string): Promise<Faq[]> {
  return apiRequest<Faq[]>(`${FAQS_URL}?include_inactive=true`, token);
}

export function createFaq(token: string, input: FaqInput): Promise<Faq> {
  return apiRequest<Faq>(FAQS_URL, token, { method: 'POST', body: JSON.stringify(input) });
}

export function updateFaq(token: string, id: string, input: Partial<FaqInput>): Promise<Faq> {
  return apiRequest<Faq>(`${FAQS_URL}/${encodeURIComponent(id)}`, token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteFaq(token: string, id: string): Promise<void> {
  await apiRequest<void>(`${FAQS_URL}/${encodeURIComponent(id)}`, token, { method: 'DELETE' });
}

export function getTerms(token: string): Promise<Terms[]> {
  return apiRequest<Terms[]>(TERMS_URL, token);
}

export function saveTerms(
  token: string,
  audience: ContentAudience,
  input: TermsInput,
): Promise<Terms> {
  return apiRequest<Terms>(`${TERMS_URL}/${audience}`, token, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteTerms(token: string, audience: ContentAudience): Promise<void> {
  await apiRequest<void>(`${TERMS_URL}/${audience}`, token, { method: 'DELETE' });
}
