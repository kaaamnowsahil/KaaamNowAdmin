import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { createRecord, listAllRecords, updateRecord, type Numeric } from '@/api/adminResources';
import { getLookupItems, type LookupItem } from '@/api/workCategories';
import { getWorkers } from '@/api/workers';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, rupees, useAdminCall, type TabProps } from '@/features/marketplace/shared';

import { rupeesToMinor } from './routeMath';

type CommissionRule = {
  id: string;
  scope: 'category' | 'worker';
  category_id: string | null;
  worker_profile_id: string | null;
  percentage: Numeric;
  min_minor: number | null;
  max_minor: number | null;
  is_active: boolean;
  notes: string;
  updated_at: string;
};

type Form = {
  id: string | null;
  scope: 'category' | 'worker';
  target: string;
  percentage: string;
  min: string;
  max: string;
  notes: string;
};

const EMPTY: Form = { id: null, scope: 'category', target: '', percentage: '', min: '', max: '', notes: '' };
const RESOURCE = 'commission_rules';
const toRupees = (minor: number | null) => (minor == null ? '' : String(minor / 100));

/** Parses the form; returns the payload or a message. */
function payload(form: Form): { body: Record<string, unknown> } | { message: string } {
  const pct = Number(form.percentage);
  if (!/^\d+(\.\d{1,2})?$/.test(form.percentage.trim()) || pct > 100) {
    return { message: 'Commission must be 0–100 with at most 2 decimals.' };
  }
  const min = form.min.trim() ? rupeesToMinor(form.min) : null;
  const max = form.max.trim() ? rupeesToMinor(form.max) : null;
  if ((form.min.trim() && min === null) || (form.max.trim() && max === null)) {
    return { message: 'Minimum / maximum must be positive rupee amounts.' };
  }
  if (min !== null && max !== null && min > max) return { message: 'Minimum cannot be above maximum.' };
  if (!form.id && !form.target) return { message: `Choose a ${form.scope === 'worker' ? 'Worker' : 'work category'}.` };
  const body: Record<string, unknown> = {
    percentage: form.percentage.trim(),
    min_minor: min,
    max_minor: max,
    notes: form.notes.trim(),
  };
  if (!form.id) {
    body.scope = form.scope;
    body[form.scope === 'worker' ? 'worker_profile_id' : 'category_id'] = form.target;
    body.is_active = true;
  }
  return { body };
}

/**
 * Worker commission overrides. Precedence at booking: Worker rule > category rule > the default
 * worker commission in Shift pricing. Each booking keeps a snapshot, so edits apply to new bookings only.
 */
export function CommissionRulesTab({ token, onSessionExpired }: TabProps) {
  const { busy, error, setError, run } = useAdminCall(onSessionExpired);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const result = await run(() =>
      Promise.all([
        listAllRecords<CommissionRule>(token, RESOURCE, { sort: '-updated_at' }),
        getLookupItems(token, 'work-categories'),
        getWorkers(token),
      ]),
    );
    if (!result) return;
    setRules(result[0]);
    setCategories(result[1]);
    setWorkers(result[2].map((worker) => ({ id: worker.id, name: `${worker.name} · ${worker.phone}` })));
  }, [run, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((item) => map.set(item.id, item.name));
    workers.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [categories, workers]);

  const set = (key: keyof Form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice('');
    const parsed = payload(form);
    if ('message' in parsed) return setError(parsed.message);
    const saved = await run(() =>
      form.id ? updateRecord(token, RESOURCE, form.id, parsed.body) : createRecord(token, RESOURCE, parsed.body),
    );
    if (!saved) return;
    setForm(EMPTY);
    setNotice('Saved. It applies to bookings made from now on.');
    void load();
  };

  const toggle = async (rule: CommissionRule) => {
    const saved = await run(() => updateRecord(token, RESOURCE, rule.id, { is_active: !rule.is_active }));
    if (saved) void load();
  };

  const edit = (rule: CommissionRule) =>
    setForm({
      id: rule.id,
      scope: rule.scope,
      target: rule.category_id ?? rule.worker_profile_id ?? '',
      percentage: String(Number(rule.percentage)),
      min: toRupees(rule.min_minor),
      max: toRupees(rule.max_minor),
      notes: rule.notes,
    });

  const targets = form.scope === 'worker' ? workers : categories;

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{form.id ? 'Edit commission rule' : 'New commission rule'}</h2>
            <p>
              Worker rule beats category rule beats the default Worker commission (Marketplace → Shift pricing). One active
              rule per Worker and per category. Every change is in the Activity log.
            </p>
          </div>
        </div>
        <form className="hold-form" noValidate onSubmit={(event) => void submit(event)}>
          <label>
            Applies to
            <select disabled={Boolean(form.id)} onChange={(event) => setForm({ ...form, scope: event.target.value as Form['scope'], target: '' })} value={form.scope}>
              <option value="category">A work category</option>
              <option value="worker">One Worker</option>
            </select>
          </label>
          <label>
            {form.scope === 'worker' ? 'Worker' : 'Work category'}
            <select disabled={Boolean(form.id)} onChange={(event) => set('target', event.target.value)} value={form.target}>
              <option value="">Choose…</option>
              {targets.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Commission (% of Worker pay)
            <input inputMode="decimal" onChange={(event) => set('percentage', event.target.value)} value={form.percentage} />
          </label>
          <label>
            Minimum commission (₹, optional)
            <input inputMode="decimal" onChange={(event) => set('min', event.target.value)} value={form.min} />
          </label>
          <label>
            Maximum commission (₹, optional)
            <input inputMode="decimal" onChange={(event) => set('max', event.target.value)} value={form.max} />
            <span className="field-hint">Commission never exceeds the Worker's pay.</span>
          </label>
          <label>
            Note
            <input maxLength={200} onChange={(event) => set('notes', event.target.value)} value={form.notes} />
          </label>
          <div className="approve-row">
            <button className="primary-button" disabled={busy} type="submit">{form.id ? 'Save changes' : 'Add rule'}</button>
            {form.id ? <button className="secondary-button" onClick={() => setForm(EMPTY)} type="button">Cancel</button> : null}
          </div>
        </form>
        {notice ? <div className="inline-notice" role="status">{notice}</div> : null}
        {error ? <div className="inline-error" role="alert">{error}</div> : null}
      </section>
      <section className="panel">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr><th>APPLIES TO</th><th>COMMISSION</th><th>MIN</th><th>MAX</th><th>STATUS</th><th>NOTE</th><th>UPDATED</th><th /></tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const target = rule.category_id ?? rule.worker_profile_id ?? '';
                return (
                  <tr key={rule.id}>
                    <td>{rule.scope === 'worker' ? 'Worker' : 'Category'}: {names.get(target) ?? target}</td>
                    <td>{Number(rule.percentage)}%</td>
                    <td>{rupees(rule.min_minor)}</td>
                    <td>{rupees(rule.max_minor)}</td>
                    <td><StatusBadge tone={rule.is_active ? 'success' : 'neutral'}>{rule.is_active ? 'Active' : 'Off'}</StatusBadge></td>
                    <td>{rule.notes || '—'}</td>
                    <td>{formatDate(rule.updated_at)}</td>
                    <td>
                      <button className="text-button" disabled={busy} onClick={() => edit(rule)} type="button">Edit</button>
                      <button className="text-button" disabled={busy} onClick={() => void toggle(rule)} type="button">
                        {rule.is_active ? 'Turn off' : 'Turn on'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!rules.length && <tr><td colSpan={8}>{busy ? 'Loading…' : 'No overrides: every booking uses the default commission.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
