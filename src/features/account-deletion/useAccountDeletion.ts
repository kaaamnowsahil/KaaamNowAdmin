import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import {
  addDeletionHold,
  ApiError,
  approveDeletionRequest,
  getDeletionDetail,
  getDeletionRequests,
  releaseDeletionHold,
} from '@/api/accountDeletion';
import type {
  DeletionDetail,
  DeletionRequest,
  DeletionStatus,
  HoldBasis,
} from '@/api/accountDeletion';

type UseAccountDeletionOptions = {
  token: string;
  onSessionExpired: () => void;
};

export function useAccountDeletion({ token, onSessionExpired }: UseAccountDeletionOptions) {
  const [status, setStatus] = useState<DeletionStatus>('pending');
  const [queue, setQueue] = useState<DeletionRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<DeletionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [basis, setBasis] = useState<HoldBasis>('pending_booking');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [expiresOn, setExpiresOn] = useState('');

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDeletionRequests(token, status, offset);
      setQueue(result.items);
      setTotal(result.total);
      if (selectedId && !result.items.some(item => item.id === selectedId)) {
        setSelectedId('');
        setDetail(null);
      }
      return true;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onSessionExpired();
      } else {
        setError(cause instanceof Error ? cause.message : 'Could not load deletion requests.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [offset, onSessionExpired, selectedId, status, token]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setError('');
    try {
      setDetail(await getDeletionDetail(token, id));
      return true;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onSessionExpired();
      } else {
        setDetail(null);
        setError(cause instanceof Error ? cause.message : 'Could not load request details.');
      }
      return false;
    } finally {
      setDetailLoading(false);
    }
  }, [onSessionExpired, token]);

  useEffect(() => { void loadQueue(); }, [loadQueue]);
  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [loadDetail, selectedId]);

  const selectedRequest = useMemo(
    () => detail ? detail.request : queue.find(item => item.id === selectedId),
    [detail, queue, selectedId],
  );

  const refreshSelected = async (message: string) => {
    setNotice('');
    setError('');
    if (selectedId && !(await loadDetail(selectedId))) return;
    if (await loadQueue()) setNotice(message);
  };

  const approve = async () => {
    if (!selectedRequest || selectedRequest.blockers.length > 0 || busy) return;
    setBusy(true);
    setBusyAction('approve');
    setError('');
    setNotice('');
    try {
      await approveDeletionRequest(token, selectedRequest.id);
      await refreshSelected('Approval recorded by the server.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Approval failed.');
    } finally {
      setBusyAction('');
      setBusy(false);
    }
  };

  const addHold = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest || !reason.trim() || !expiresOn || busy) return;
    const expiry = new Date(`${expiresOn}T23:59:59`).toISOString();
    const daysUntilExpiry = (new Date(expiry).getTime() - Date.now()) / 86_400_000;
    if (daysUntilExpiry <= 0 || daysUntilExpiry > 30) {
      setError('Choose an expiry date within the next 30 days.');
      return;
    }
    setBusy(true);
    setBusyAction('add-hold');
    setError('');
    setNotice('');
    try {
      await addDeletionHold(token, selectedRequest.id, {
        basis,
        reason: reason.trim(),
        reference: reference.trim() || null,
        expires_at: expiry,
      });
      setReason('');
      setReference('');
      setExpiresOn('');
      await refreshSelected('Hold recorded by the server.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not add hold.');
    } finally {
      setBusyAction('');
      setBusy(false);
    }
  };

  const releaseHold = async (holdId: string) => {
    if (!selectedRequest || busy) return;
    setBusy(true);
    setBusyAction(holdId);
    setError('');
    setNotice('');
    try {
      await releaseDeletionHold(token, selectedRequest.id, holdId);
      await refreshSelected('Hold release recorded by the server.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not release hold.');
    } finally {
      setBusyAction('');
      setBusy(false);
    }
  };

  return {
    addHold,
    approve,
    basis,
    busy,
    busyAction,
    detail,
    detailLoading,
    error,
    expiresOn,
    loadQueue,
    loading,
    maxExpiry: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    minExpiry: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
    notice,
    offset,
    queue,
    reason,
    reference,
    releaseHold,
    selectedId,
    selectedRequest,
    setBasis,
    setExpiresOn,
    setOffset,
    setReason,
    setReference,
    setSelectedId,
    setStatus,
    setDetail,
    status,
    total,
  };
}
