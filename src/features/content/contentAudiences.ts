import type { ContentAudience } from '@/api/content';

export const AUDIENCES: ContentAudience[] = ['all', 'worker', 'business'];

export const AUDIENCE_LABELS: Record<ContentAudience, string> = {
  all: 'Everyone',
  worker: 'Workers',
  business: 'Businesses',
};
