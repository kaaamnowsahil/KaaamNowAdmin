import { type FormEvent, useCallback, useEffect, useState } from 'react';

import {
  getEffectiveSearchRadius,
  saveSearchRadius,
  type EffectiveSearchRadius,
  type SearchRadiusFields,
} from '@/api/searchRadius';

import { useAdminCall, type TabProps } from './shared';

type Key = keyof SearchRadiusFields;
type Form = Record<Key, string> & { notes: string };
type FormErrors = Partial<Record<Key | 'notes', string>>;

const FIELDS: { key: Key; label: string; hint: string }[] = [
  {
    key: 'live_initial_radius_km',
    label: 'Live Work: first search radius',
    hint: 'Workers inside this distance get the request first.',
  },
  {
    key: 'live_max_radius_km',
    label: 'Live Work: widened search radius',
    hint: 'The search widens to this after the first round. Also the "available Workers" count and map.',
  },
  {
    key: 'scheduled_notify_radius_km',
    label: 'Shift: "new shift near you" alert radius',
    hint: 'Workers inside this distance get a push alert when a shift is published.',
  },
  {
    key: 'feed_radius_km',
    label: 'Worker feed: default radius',
    hint: 'Distance the Worker shift list covers by default.',
  },
  {
    key: 'worker_max_shift_distance_km',
    label: 'Worker: maximum shift distance',
    hint: 'Workers never see or apply to shifts farther than this.',
  },
];

const KM_PATTERN = /^\d{1,3}(\.\d)?$/;
const MIN_KM = 0.5;
const MAX_KM = 100;

const toForm = (radius: EffectiveSearchRadius): Form => ({
  live_initial_radius_km: String(radius.live_initial_radius_km),
  live_max_radius_km: String(radius.live_max_radius_km),
  scheduled_notify_radius_km: String(radius.scheduled_notify_radius_km),
  feed_radius_km: String(radius.feed_radius_km),
  worker_max_shift_distance_km: String(radius.worker_max_shift_distance_km),
  notes: '',
});

export function validateSearchRadius(form: Form): FormErrors {
  const errors: FormErrors = {};
  for (const { key } of FIELDS) {
    const text = form[key].trim();
    const value = Number(text);
    if (!KM_PATTERN.test(text)) errors[key] = 'Enter km with at most one decimal, e.g. 5 or 7.5.';
    else if (value < MIN_KM || value > MAX_KM) errors[key] = `Between ${MIN_KM} and ${MAX_KM} km.`;
  }
  if (!errors.live_max_radius_km && !errors.live_initial_radius_km && Number(form.live_max_radius_km) < Number(form.live_initial_radius_km)) {
    errors.live_max_radius_km = 'Must be at least the first search radius.';
  }
  if (!errors.feed_radius_km && !errors.worker_max_shift_distance_km && Number(form.feed_radius_km) > Number(form.worker_max_shift_distance_km)) {
    errors.feed_radius_km = 'Cannot be more than the maximum shift distance.';
  }
  if (!form.notes.trim()) errors.notes = 'Say why the distances are changing.';
  return errors;
}

/** Search distances for Live Work dispatch, shift alerts and the Worker feed (audited). */
export function SearchRadiusTab({ token, onSessionExpired }: TabProps) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [current, setCurrent] = useState<EffectiveSearchRadius | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const next = await run(() => getEffectiveSearchRadius(token));
    if (next) {
      setCurrent(next);
      setForm(toForm(next));
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
    const nextErrors = validateSearchRadius(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const values = Object.fromEntries(FIELDS.map(({ key }) => [key, Number(form[key])])) as SearchRadiusFields;
    const saved = await run(async () => {
      await saveSearchRadius(token, values, form.notes.trim());
      return true;
    });
    if (saved) {
      setNotice('Saved. New searches and feeds use these distances now; Live Work searches already running keep theirs.');
      void load();
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Search radius</h2>
            <p>
              {current?.source === 'admin'
                ? 'Set by an admin. Every change is recorded in the audit log.'
                : 'Using the server defaults. Saving here overrides them for everyone.'}
            </p>
          </div>
        </div>
        {form ? (
          <form className="hold-form" noValidate onSubmit={(event) => void submit(event)}>
            {FIELDS.map(({ key, label, hint }) => (
              <label key={key}>
                {label} (km)
                <input
                  aria-invalid={Boolean(errors[key])}
                  inputMode="decimal"
                  onChange={(event) => set(key, event.target.value)}
                  value={form[key]}
                />
                <span className="field-hint">{hint}</span>
                {errors[key] ? <span className="field-error">{errors[key]}</span> : null}
              </label>
            ))}
            <label>
              Reason for change
              <input maxLength={300} onChange={(event) => set('notes', event.target.value)} value={form.notes} />
              {errors.notes ? <span className="field-error">{errors.notes}</span> : null}
            </label>
            <button className="primary-button" disabled={busy} type="submit">
              Save distances
            </button>
          </form>
        ) : null}
        {notice ? <div className="inline-notice" role="status">{notice}</div> : null}
        {error ? <div className="inline-error" role="alert">{error}</div> : null}
      </section>
    </div>
  );
}
