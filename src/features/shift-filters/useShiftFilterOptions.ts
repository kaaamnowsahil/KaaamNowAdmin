import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/api/client';
import {
  createShiftFilterOption,
  deleteShiftFilterOption,
  getShiftFilterOptions,
  updateShiftFilterOption,
  type ShiftFilterOption,
  type ShiftFilterOptionInput,
} from '@/api/shiftFilters';

type UseShiftFilterOptionsArgs = {
  token: string;
  onSessionExpired: () => void;
};

export function useShiftFilterOptions({
  token,
  onSessionExpired,
}: UseShiftFilterOptionsArgs) {
  const [options, setOptions] = useState<ShiftFilterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOptions(await getShiftFilterOptions(token));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not load shift filters.');
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (input: ShiftFilterOptionInput) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const created = await createShiftFilterOption(token, input);
      setOptions(current =>
        [...current, created].sort(
          (a, b) =>
            a.filter_type.localeCompare(b.filter_type) || a.sort_order - b.sort_order,
        ),
      );
      setNotice(`${created.label} added.`);
      return true;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not add shift filter.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const update = async (option: ShiftFilterOption, input: ShiftFilterOptionInput) => {
    setBusyId(option.id);
    setError('');
    setNotice('');
    try {
      const updated = await updateShiftFilterOption(token, option.id, input);
      setOptions(current =>
        current
          .map(item => item.id === updated.id ? updated : item)
          .sort(
            (a, b) =>
              a.filter_type.localeCompare(b.filter_type) || a.sort_order - b.sort_order,
          ),
      );
      setNotice(`${updated.label} updated.`);
      return true;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not update shift filter.');
      return false;
    } finally {
      setBusyId('');
    }
  };

  const remove = async (option: ShiftFilterOption) => {
    setBusyId(option.id);
    setError('');
    setNotice('');
    try {
      await deleteShiftFilterOption(token, option.id);
      setOptions(current =>
        current.map(item => item.id === option.id ? { ...item, is_active: false } : item),
      );
      setNotice(`${option.label} deactivated.`);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not deactivate shift filter.');
    } finally {
      setBusyId('');
    }
  };

  const restore = async (option: ShiftFilterOption) => {
    await update(option, {
      filter_type: option.filter_type,
      slug: option.slug,
      label: option.label,
      min_value: option.min_value,
      max_value: option.max_value,
      sort_order: option.sort_order,
      is_active: true,
    });
  };

  return { busyId, create, error, load, loading, notice, options, remove, restore, saving, update };
}
