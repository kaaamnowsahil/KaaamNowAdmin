import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/api/client';

export type TabProps = { token: string; onSessionExpired: () => void };

export const rupees = (minor: number | string | null | undefined) =>
  minor == null || minor === ''
    ? '—'
    : `₹${(Number(minor) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function errorText(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Something went wrong.';
}

/** Runs one admin call; a 401 signs the admin out instead of showing an error. */
export function useAdminCall(onSessionExpired: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
      setBusy(true);
      setError('');
      try {
        return await action();
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
        else setError(errorText(cause));
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [onSessionExpired],
  );

  return { busy, error, setError, run };
}

/** Loads a list once (and on `reload`), with the same 401 handling. */
export function useAdminList<T>(load: () => Promise<T[]>, onSessionExpired: () => void) {
  const [items, setItems] = useState<T[]>([]);
  const call = useAdminCall(onSessionExpired);
  const { run } = call;

  const reload = useCallback(async () => {
    const next = await run(load);
    if (next) setItems(next);
  }, [load, run]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, reload, ...call };
}
