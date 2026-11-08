import { type FormEvent, useCallback, useEffect, useState } from 'react';

import {
  getEffectivePayoutSettings,
  saveMinWithdrawal,
  type EffectivePayoutSettings,
} from '@/api/payoutSettings';
import { formatMinorRupees } from '@/utils/format';

import { useAdminCall, type TabProps } from './shared';

type Form = { rupees: string; notes: string };
type FormErrors = Partial<Record<keyof Form, string>>;

const RUPEES_PATTERN = /^\d{1,6}(\.\d{1,2})?$/;
const MIN_RUPEES = 1;
const MAX_RUPEES = 100000;

export function validateMinWithdrawal(form: Form): FormErrors {
  const errors: FormErrors = {};
  const text = form.rupees.trim();
  const value = Number(text);
  if (!RUPEES_PATTERN.test(text)) errors.rupees = 'Enter rupees, e.g. 1, 100 or 5000.';
  else if (value < MIN_RUPEES || value > MAX_RUPEES) {
    errors.rupees = `Between ₹${MIN_RUPEES} and ₹${MAX_RUPEES.toLocaleString('en-IN')}.`;
  }
  if (!form.notes.trim()) errors.notes = 'Say why the minimum is changing.';
  return errors;
}

/** Smallest amount a Worker can withdraw (audited). */
export function WithdrawalSettingsTab({ token, onSessionExpired }: TabProps) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [current, setCurrent] = useState<EffectivePayoutSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const next = await run(() => getEffectivePayoutSettings(token));
    if (next) {
      setCurrent(next);
      setForm({ rupees: String(next.min_withdrawal_minor / 100), notes: '' });
    }
  }, [run, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (key: keyof Form, value: string) => {
    setForm((existing) => (existing ? { ...existing, [key]: value } : existing));
    setErrors((existing) => ({ ...existing, [key]: undefined }));
    setNotice('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const nextErrors = validateMinWithdrawal(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const minor = Math.round(Number(form.rupees) * 100);
    const saved = await run(async () => {
      await saveMinWithdrawal(token, minor, form.notes.trim());
      return true;
    });
    if (saved) {
      setNotice('Saved. Workers see the new minimum the next time they open Earnings or Withdraw.');
      void load();
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Withdrawals</h2>
            <p>
              {current
                ? `Minimum withdrawal now: ${formatMinorRupees(current.min_withdrawal_minor)}. ${
                    current.source === 'admin'
                      ? 'Set by an admin. Every change is recorded in the audit log.'
                      : 'Using the server default. Saving here overrides it for everyone.'
                  }`
                : 'Loading…'}
            </p>
          </div>
        </div>
        {form ? (
          <form className="hold-form" noValidate onSubmit={(event) => void submit(event)}>
            <label>
              Minimum withdrawal (₹)
              <input
                aria-invalid={Boolean(errors.rupees)}
                inputMode="decimal"
                onChange={(event) => set('rupees', event.target.value)}
                value={form.rupees}
              />
              <span className="field-hint">
                Workers can withdraw any amount from this up to their available balance.
              </span>
              {errors.rupees ? <span className="field-error">{errors.rupees}</span> : null}
            </label>
            <label>
              Reason for change
              <input maxLength={300} onChange={(event) => set('notes', event.target.value)} value={form.notes} />
              {errors.notes ? <span className="field-error">{errors.notes}</span> : null}
            </label>
            <button className="primary-button" disabled={busy} type="submit">
              Save minimum
            </button>
          </form>
        ) : null}
        {notice ? <div className="inline-notice" role="status">{notice}</div> : null}
        {error ? <div className="inline-error" role="alert">{error}</div> : null}
      </section>
    </div>
  );
}
