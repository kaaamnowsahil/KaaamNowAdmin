import { useState } from 'react';

import { markWithdrawalPaid, rejectWithdrawal, type ManualPayoutResult } from '@/api/withdrawals';
import { StatusBadge } from '@/components/StatusBadge';
import { useAdminCall } from '@/features/marketplace/shared';
import type { Payout } from '@/types';
import { formatMinorRupees } from '@/utils/format';

type Props = {
  payout: Payout;
  token: string;
  onSessionExpired: () => void;
  onSettled: () => void;
};

const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp';
const UTR_PATTERN = /^[A-Za-z0-9]{0,40}$/;

/** Manual withdrawal: pay the worker outside the app, then upload the screenshot and mark it paid. */
export function ManualPayoutPanel({ payout: initial, token, onSessionExpired, onSettled }: Props) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [proof, setProof] = useState<File | null>(null);
  const [utr, setUtr] = useState('');
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<ManualPayoutResult | null>(null);

  const payout: Payout = result
    ? {
        ...initial,
        status: result.status,
        utr: result.payout_utr,
        proofUrl: result.proof_url,
        failureReason: result.failure_reason,
      }
    : initial;
  const waiting = payout.provider === 'manual' && (payout.status === 'initiated' || payout.status === 'processing');
  const utrOk = UTR_PATTERN.test(utr.trim());

  const settle = (done: ManualPayoutResult | undefined, message: string) => {
    if (!done) return;
    setResult(done);
    setNotice(message);
    onSettled();
  };

  const markPaid = async () => {
    if (!proof) return;
    settle(
      await run(() => markWithdrawalPaid(token, payout.id, proof, utr)),
      'Marked paid. The worker has been notified.',
    );
  };

  const reject = async () => {
    settle(
      await run(() => rejectWithdrawal(token, payout.id, reason)),
      'Rejected. The amount is back in the worker’s balance and they have been notified.',
    );
  };

  if (!waiting) {
    if (payout.provider !== 'manual') return null;
    return (
      <section className={`panel account-hold account-hold-${payout.status === 'paid' ? 'success' : 'danger'}`}>
        <div className="account-hold-head">
          <div>
            <h2>Manual payout</h2>
            <p>
              {payout.status === 'paid'
                ? payout.utr ? `Paid · UTR ${payout.utr}` : 'Paid'
                : `Rejected · ${payout.failureReason ?? ''}`}
            </p>
          </div>
          <StatusBadge tone={payout.status === 'paid' ? 'success' : 'danger'}>
            {payout.status === 'paid' ? 'Paid' : 'Rejected'}
          </StatusBadge>
        </div>
        {notice ? <div className="inline-notice" role="status">{notice}</div> : null}
        {payout.proofUrl ? (
          <a className="payout-proof" href={payout.proofUrl} rel="noreferrer" target="_blank">
            <img alt="Payment screenshot" src={payout.proofUrl} />
            <span>Open payment screenshot</span>
          </a>
        ) : null}
      </section>
    );
  }

  return (
    <section className="panel account-hold account-hold-warning">
      <div className="account-hold-head">
        <div>
          <h2>Pay {formatMinorRupees(payout.amountMinor)} to {payout.workerName}</h2>
          <p>Send the money from your bank or UPI app, then upload the payment screenshot and mark it paid.</p>
        </div>
        <StatusBadge tone="warning">Waiting</StatusBadge>
      </div>

      <dl className="payout-pay-to">
        {payout.payTo.map(item => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value || 'Unavailable'}</dd>
          </div>
        ))}
        <div>
          <dt>Reference</dt>
          <dd>{payout.reference}</dd>
        </div>
      </dl>

      {error ? <div className="inline-error" role="alert">{error}</div> : null}

      {!rejecting ? (
        <div className="account-hold-form">
          <label htmlFor="payout-proof">
            <span>Payment screenshot</span>
            <small>PNG, JPEG or WebP</small>
          </label>
          <input
            accept={ACCEPTED_IMAGES}
            id="payout-proof"
            onChange={event => setProof(event.target.files?.[0] ?? null)}
            type="file"
          />
          <label htmlFor="payout-utr">
            <span>UTR / transaction ID</span>
            <small>Optional</small>
          </label>
          <input
            id="payout-utr"
            maxLength={40}
            onChange={event => setUtr(event.target.value)}
            placeholder="e.g. 412345678901"
            value={utr}
          />
          <div className="account-hold-actions">
            <button className="secondary-button" disabled={busy} onClick={() => setRejecting(true)} type="button">
              Reject instead
            </button>
            <button
              className="primary-button"
              disabled={busy || !proof || !utrOk}
              onClick={() => void markPaid()}
              type="button"
            >
              {busy ? 'Saving…' : 'Mark paid'}
            </button>
          </div>
        </div>
      ) : (
        <div className="account-hold-form">
          <label htmlFor="payout-reject-reason">
            <span>Reason the worker will see</span>
            <small>{reason.trim().length}/200</small>
          </label>
          <textarea
            id="payout-reject-reason"
            maxLength={200}
            onChange={event => setReason(event.target.value)}
            placeholder="e.g. UPI ID is not valid, please add a new one"
            value={reason}
          />
          <div className="account-hold-actions">
            <button className="secondary-button" disabled={busy} onClick={() => setRejecting(false)} type="button">
              Back
            </button>
            <button
              className="primary-button"
              disabled={busy || reason.trim().length < 5}
              onClick={() => void reject()}
              type="button"
            >
              {busy ? 'Rejecting…' : 'Reject and return money'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
