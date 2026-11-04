import { useCallback, useEffect, useState } from 'react';

import { listRecords } from '@/api/adminResources';
import { StatusBadge } from '@/components/StatusBadge';
import { applyBookingOverride } from '@/api/bookings';
import { getLatestAssignmentId, type WorkerRestrictions } from '@/api/workerRecords';

import { formatDate, useAdminCall, type TabProps } from './shared';

/** Account-hold status for one worker user, with the Unban override. */
export function WorkerHoldPanel({ token, onSessionExpired, userId }: TabProps & { userId: string }) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [profile, setProfile] = useState<WorkerRestrictions | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const page = await run(() =>
      listRecords<WorkerRestrictions>(token, 'worker_profiles', { limit: 1, filters: { user_id: userId } }),
    );
    if (page) setProfile(page.items[0] ?? null);
  }, [run, token, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!profile) return error ? <div className="inline-error" role="alert">{error}</div> : null;

  const limited = profile.feed_limited_until && new Date(profile.feed_limited_until).getTime() > Date.now();
  const restricted = Boolean(profile.banned_at || limited);
  const reasonOk = reason.trim().length >= 5;

  const unban = async () => {
    setNotice('');
    const done = await run(async () => {
      const target = await getLatestAssignmentId(token, profile.id);
      if (!target) throw new Error('This worker has no bookings to attach the override to.');
      return applyBookingOverride(token, target, { action: 'unban_worker', reason: reason.trim() });
    });
    if (done) {
      setReason('');
      setNotice('Hold removed, active strikes cleared and the worker notified.');
      void load();
    }
  };

  const tone = profile.banned_at ? 'danger' : limited ? 'warning' : 'success';

  return (
    <section className={`panel account-hold account-hold-${tone}`}>
      <div className="account-hold-head">
        <div>
          <h2>Account hold</h2>
          <p>
            {profile.banned_at
              ? `On hold since ${formatDate(profile.banned_at)}. The worker can't see or accept shifts.`
              : limited
                ? `Fewer shifts in the feed until ${formatDate(profile.feed_limited_until)}.`
                : 'Not on hold. Holds are added automatically when strikes reach the limit.'}
          </p>
        </div>
        <StatusBadge tone={tone}>{profile.banned_at ? 'On hold' : limited ? 'Fewer shifts' : 'No hold'}</StatusBadge>
      </div>
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}
      {restricted && (
        <div className="account-hold-form">
          <label htmlFor="account-hold-reason">
            <span>Reason for removing</span>
            <small>{reason.trim().length}/500</small>
          </label>
          <textarea
            id="account-hold-reason"
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Checked with the worker, no-shows were test bookings"
            value={reason}
          />
          <div className="account-hold-actions">
            <p>At least 5 characters. Clears the worker&apos;s active strikes and notifies them.</p>
            <button className="primary-button" disabled={busy || !reasonOk} onClick={() => void unban()} type="button">
              {busy ? 'Removing…' : profile.banned_at ? 'Remove hold (unban)' : 'Remove limit'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
