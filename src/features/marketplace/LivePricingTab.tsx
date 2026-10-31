import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/api/client';
import {
  getLivePricing,
  getLivePricingAudit,
  updateLivePricing,
  type LivePricingAuditItem,
  type LivePricingSettings,
  type LivePricingSettingsInput,
  type TaxBase,
} from '@/api/liveWork';

import { percentError, previewPrice, TAX_BASE_LABEL } from './livePricingMath';
import { errorText, formatDate, rupees, type TabProps } from './shared';

type Form = LivePricingSettingsInput;
type FormErrors = Partial<Record<keyof Form, string>>;

const EXAMPLE_RATE_MINOR = 50_000;
const EXAMPLE_MINUTES = 120;
const FIELD_LABELS: Record<string, string> = {
  commission_pct: 'Platform charge %',
  tax_pct: 'Payment gateway charge %',
  tax_label: 'Invoice label',
  tax_base: 'Payment gateway charge applied to',
  extension_surcharge_pct: 'Extension surcharge %',
  notes: 'Notes',
};

const toForm = (settings: LivePricingSettings): Form => ({
  commission_pct: String(settings.commission_pct),
  tax_pct: String(settings.tax_pct),
  tax_label: settings.tax_label,
  tax_base: settings.tax_base,
  extension_surcharge_pct: String(settings.extension_surcharge_pct),
  notes: '',
});

function validate(form: Form): FormErrors {
  const errors: FormErrors = {};
  for (const key of ['commission_pct', 'tax_pct', 'extension_surcharge_pct'] as const) {
    const message = percentError(form[key]);
    if (message) errors[key] = message;
  }
  if (!form.tax_label.trim()) errors.tax_label = 'Required.';
  else if (form.tax_label.trim().length > 40) errors.tax_label = 'At most 40 characters.';
  return errors;
}

function changedFields(form: Form, current: LivePricingSettings) {
  const before = toForm(current);
  return (['commission_pct', 'tax_pct', 'tax_label', 'tax_base', 'extension_surcharge_pct'] as const).filter(
    (key) =>
      key === 'tax_label' || key === 'tax_base'
        ? form[key].trim() !== before[key]
        : Number(form[key]) !== Number(before[key]),
  );
}

/** Live Work Pricing & Charges: platform charge, payment gateway charge and extension surcharge,
 * with an audit trail. */
export function LivePricingTab({ token, onSessionExpired }: TabProps) {
  const [settings, setSettings] = useState<LivePricingSettings | null>(null);
  const [audit, setAudit] = useState<LivePricingAuditItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handle = useCallback(
    (cause: unknown) => {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else if (cause instanceof ApiError && Object.keys(cause.fieldErrors).length) {
        setErrors(cause.fieldErrors as FormErrors);
        setError(cause.message);
      } else setError(errorText(cause));
    },
    [onSessionExpired],
  );

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const [current, history] = await Promise.all([getLivePricing(token), getLivePricingAudit(token)]);
      setSettings(current);
      setForm(toForm(current));
      setAudit(history.items);
      setAuditTotal(history.total);
    } catch (cause) {
      handle(cause);
    } finally {
      setBusy(false);
    }
  }, [handle, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (key: keyof Form, value: string) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setConfirming(false);
    setNotice('');
  };

  const review = (event: FormEvent) => {
    event.preventDefault();
    if (!form || !settings) return;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (!changedFields(form, settings).length) {
      setError('Nothing changed.');
      return;
    }
    setError('');
    setConfirming(true);
  };

  const save = async () => {
    if (!form) return;
    setBusy(true);
    setError('');
    try {
      const next = await updateLivePricing(token, {
        ...form,
        tax_label: form.tax_label.trim(),
        notes: form.notes.trim(),
      });
      setSettings(next);
      setForm(toForm(next));
      setConfirming(false);
      setNotice(`Saved as version ${next.version}. New Live Work bookings use it; existing bookings keep their price.`);
      const history = await getLivePricingAudit(token);
      setAudit(history.items);
      setAuditTotal(history.total);
    } catch (cause) {
      setConfirming(false);
      handle(cause);
    } finally {
      setBusy(false);
    }
  };

  const loadMoreAudit = async () => {
    try {
      const page = await getLivePricingAudit(token, audit.length);
      setAudit((current) => [...current, ...page.items]);
      setAuditTotal(page.total);
    } catch (cause) {
      handle(cause);
    }
  };

  if (!settings || !form) {
    return (
      <div className="page-stack">
        {error ? <div className="inline-error" role="alert">{error}</div> : <p className="muted-copy">Loading…</p>}
      </div>
    );
  }

  const valid = !Object.keys(validate(form)).length;
  const preview = valid
    ? previewPrice({
        commissionPct: Number(form.commission_pct),
        taxPct: Number(form.tax_pct),
        taxBase: form.tax_base,
        surchargePct: Number(form.extension_surcharge_pct),
        hourlyRateMinor: EXAMPLE_RATE_MINOR,
        minutes: EXAMPLE_MINUTES,
      })
    : null;
  const label = 'payment gateway charge';
  const changes = changedFields(form, settings);

  const field = (key: keyof Form, text: string, input: ReactNode) => (
    <label>
      {text}
      {input}
      {errors[key] ? <span className="field-error" role="alert">{errors[key]}</span> : null}
    </label>
  );

  return (
    <div className="page-stack">
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Live Work Pricing &amp; Charges · v{settings.version}</h2>
            <p>
              In effect since {formatDate(settings.effective_from)} · set by {settings.changed_by_label}. Changes apply to
              new Live Work bookings only; every booking keeps a snapshot of the values it was priced with.
            </p>
          </div>
        </div>
        <form className="hold-form" noValidate onSubmit={review}>
          {field(
            'commission_pct',
            'Platform charge %',
            <input aria-invalid={Boolean(errors.commission_pct)} inputMode="decimal" onChange={(e) => set('commission_pct', e.target.value)} value={form.commission_pct} />,
          )}
          {field(
            'tax_pct',
            'Payment gateway charge %',
            <input aria-invalid={Boolean(errors.tax_pct)} inputMode="decimal" onChange={(e) => set('tax_pct', e.target.value)} value={form.tax_pct} />,
          )}
          {field(
            'tax_label',
            'Label stored on invoices',
            <input aria-invalid={Boolean(errors.tax_label)} maxLength={40} onChange={(e) => set('tax_label', e.target.value)} value={form.tax_label} />,
          )}
          {field(
            'tax_base',
            'Payment gateway charge applied to',
            <select onChange={(e) => set('tax_base', e.target.value as TaxBase)} value={form.tax_base}>
              {(Object.keys(TAX_BASE_LABEL) as TaxBase[]).map((base) => (
                <option key={base} value={base}>{TAX_BASE_LABEL[base]}</option>
              ))}
            </select>,
          )}
          {field(
            'extension_surcharge_pct',
            'Extension surcharge %',
            <input aria-invalid={Boolean(errors.extension_surcharge_pct)} inputMode="decimal" onChange={(e) => set('extension_surcharge_pct', e.target.value)} value={form.extension_surcharge_pct} />,
          )}
          {field(
            'notes',
            'Reason for change',
            <input maxLength={300} onChange={(e) => set('notes', e.target.value)} value={form.notes} />,
          )}
          {!confirming && (
            <button className="primary-button" disabled={busy} type="submit">Review changes</button>
          )}
        </form>
        {confirming && (
          <div className="hold-form" role="alertdialog" aria-label="Confirm pricing change">
            <p>
              Change {changes.map((key) => FIELD_LABELS[key]).join(', ')}? This creates version {settings.version + 1} and
              is recorded in the change history.
            </p>
            <button className="primary-button" disabled={busy} onClick={() => void save()} type="button">Confirm and save</button>
            <button className="secondary-button" disabled={busy} onClick={() => setConfirming(false)} type="button">Back</button>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Example: ₹500/h × 2 h</h2>
            <p>
              Formula: base = rate × hours; platform charge = base × platform charge %; {label} = ({TAX_BASE_LABEL[form.tax_base].toLowerCase()})
              × {label} %; total = base + platform charge + {label}. Worker receives base − platform charge (Workers only see this amount). All amounts are rounded
              half-up to the paisa.
            </p>
          </div>
        </div>
        {preview ? (
          <table className="admin-table">
            <tbody>
              <tr><td>Base amount</td><td>{rupees(preview.base)}</td></tr>
              <tr><td>Platform charge ({form.commission_pct}%)</td><td>{rupees(preview.commission)}</td></tr>
              <tr><td>Payment gateway charge ({form.tax_pct}% of {rupees(preview.taxable)})</td><td>{rupees(preview.tax)}</td></tr>
              <tr><td className="table-primary-cell">Business pays</td><td className="table-primary-cell">{rupees(preview.total)}</td></tr>
              <tr><td>Worker receives</td><td>{rupees(preview.workerNet)}</td></tr>
              <tr><td>Extension rate (+{form.extension_surcharge_pct}%)</td><td>{rupees(preview.extensionRate)}/h</td></tr>
            </tbody>
          </table>
        ) : (
          <p className="muted-copy">Fix the highlighted fields to see the example.</p>
        )}
        <p className="muted-copy">
          Saved v{settings.version} prices this example at {rupees(settings.example.total_minor)} (server calculation).
        </p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Change history</h2>
            <p>Every change records who made it, the old and new value, and when.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr><th>WHEN</th><th>VERSION</th><th>FIELD</th><th>OLD</th><th>NEW</th><th>BY</th></tr>
            </thead>
            <tbody>
              {audit.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.changed_at)}</td>
                  <td>v{item.settings_version}</td>
                  <td>{FIELD_LABELS[item.field] ?? item.field}</td>
                  <td>{item.old_value ?? '—'}</td>
                  <td>{item.new_value}</td>
                  <td>{item.changed_by_label}</td>
                </tr>
              ))}
              {!audit.length && (
                <tr><td colSpan={6}>No changes yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {audit.length < auditTotal && (
          <button className="text-button" onClick={() => void loadMoreAudit()} type="button">Load more</button>
        )}
      </section>
    </div>
  );
}
