import type { Option } from './common';

export type AdminRole = 'superAdmin' | 'operations' | 'finance' | 'support';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  lastActiveAt: string;
};

export type PlatformSettings = {
  platformFeePercent: number;
  minHourlyRate: number;
  defaultSearchRadiusKm: number;
  maxSearchRadiusKm: number;
  checkInWindowMinutes: number;
  selectionConfirmHours: number;
  categories: Option[];
  businessTypes: Option[];
};
