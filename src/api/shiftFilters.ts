import { apiRequest } from './client';

export type ShiftFilterType = 'distance' | 'minimum_pay' | 'shift_length';

export type ShiftFilterOption = {
  id: string;
  filter_type: ShiftFilterType;
  slug: string;
  label: string;
  min_value: number | null;
  max_value: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ShiftFilterOptionInput = Omit<
  ShiftFilterOption,
  'id' | 'created_at' | 'updated_at'
>;

const OPTIONS_URL = '/api/v1/shift-filter-options';

export function getShiftFilterOptions(token: string): Promise<ShiftFilterOption[]> {
  return apiRequest<ShiftFilterOption[]>(`${OPTIONS_URL}?include_inactive=true`, token);
}

export function createShiftFilterOption(
  token: string,
  option: ShiftFilterOptionInput,
): Promise<ShiftFilterOption> {
  return apiRequest<ShiftFilterOption>(OPTIONS_URL, token, {
    method: 'POST',
    body: JSON.stringify(option),
  });
}

export function updateShiftFilterOption(
  token: string,
  id: string,
  option: ShiftFilterOptionInput,
): Promise<ShiftFilterOption> {
  return apiRequest<ShiftFilterOption>(`${OPTIONS_URL}/${encodeURIComponent(id)}`, token, {
    method: 'PATCH',
    body: JSON.stringify(option),
  });
}

export async function deleteShiftFilterOption(token: string, id: string): Promise<void> {
  await apiRequest<void>(`${OPTIONS_URL}/${encodeURIComponent(id)}`, token, {
    method: 'DELETE',
  });
}
