export type BroadcastAudience = 'all' | 'workers' | 'businesses';

export type Broadcast = {
  id: string;
  title: string;
  message: string;
  audience: BroadcastAudience;
  /** Area name, or undefined for every city. */
  area?: string;
  sentAt: string;
  reach: number;
};
