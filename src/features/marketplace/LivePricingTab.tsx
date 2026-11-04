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

import {
  parseBoostRupees,
  percentError,
  previewPrice,
  SEARCH_RULE_LIMITS,
  TAX_BASE_LABEL,
  wholeNumberError,
} from './livePricingMath';
import { errorText, formatDate, rupees, type TabProps } from './shared';

type SearchRuleKey = keyof typeof SEARCH_RULE_LIMITS;
type Form = Omit<LivePricingSettingsInput, SearchRuleKey | 'boost_options_minor'> &
  Record<SearchRuleKey, string> & { boost_rupees: string };
type FormErrors = Partial<Record<keyof Form, string>>;
const SEARCH_RULE_KEYS = Object.keys(SEARCH_RULE_LIMITS) as SearchRuleKey[];

const EXAMPLE_RATE_MINOR = 50_000;
const EXAMPLE_MINUTES = 120;
const FIELD_LABELS: Record<string, string> = {
  commission_pct: 'Platform charge %',
  tax_pct: 'Payment gateway charge %',
  tax_label: 'Invoice label',
  tax_base: 'Payment gateway charge applied to',
  extension_surcharge_pct: 'Extension surcharge %',
  search_timeout_minutes: 'Search time (minutes)',
  max_search_rounds: 'Searches per booking',
  retry_choice_minutes: 'Time to choose (minutes)',
  boost_options_minor: 'Add-on amounts (₹)',
  boost_rupees: 'Add-on amounts (₹)',
  notes: 'Notes',
};

const toRupeeList = (minor: number[]) => minor.map((m) => m / 100).join(', ');
const auditValue = (field: string, value: string) =>
  field === 'boost_options_minor' ? toRupeeList(value.split(',').map(Number)) : value;

const toForm = (settings: LivePricingSettings): Form => ({
  commission_pct: String(settings.commission_pct),
  tax_pct: String(settings.tax_pct),
  tax_label: settings.tax_label,
  tax_base: settings.tax_base,
  extension_surcharge_pct: String(settings.extension_surcharge_pct),
  search_timeout_minutes: String(settings.search_timeout_minutes),
  max_search_rounds: String(settings.max_search_rounds),
  retry_choice_minutes: String(settings.retry_choice_minutes),
  boost_rupees: toRupeeList(settings.boost_options_minor),
  notes: '',
});

const toBody = (form: Form): LivePricingSettingsInput => ({
  commission_pct: form.commission_pct,
  tax_pct: form.tax_pct,
  tax_label: form.tax_label.trim(),
  tax_base: form.tax_base,
  extension_surcharge_pct: form.extension_surcharge_pct,
  search_timeout_minutes: Number(form.search_timeout_minutes),
  max_search_rounds: Number(form.max_search_rounds),
  retry_choice_minutes: Number(form.retry_choice_minutes),
  boost_options_minor: parseBoostRupees(form.boost_rupees).minor,
  notes: form.notes.trim(),
});

function validate(form: Form): FormErrors {
  const errors: FormErrors = {};
  for (const key of ['commission_pct', 'tax_pct', 'extension_surcharge_pct'] as const) {
    const message = percentError(form[key]);
    if (message) errors[key] = message;
  }
  if (!form.tax_label.trim()) errors.tax_label = 'Required.';
  else if (form.tax_label.trim().length > 40) errors.tax_label = 'At most 40 characters.';
  for (const key of SEARCH_RULE_KEYS) {
    const [min, max] = SEARCH_RULE_LIMITS[key];
    const message = wholeNumberError(form[key], min, max);
    if (message) errors[key] = message;
  }
  const boost = parseBoostRupees(form.boost_rupees).error;
  if (boost) errors.boost_rupees = boost;
  return errors;
}

function changedFields(form: Form, current: LivePricingSettings) {
  const before = toForm(current);
  const keys = [
    'commission_pct',
    'tax_pct',
    'tax_label',
    'tax_base',
    'extension_surcharge_pct',
    ...SEARCH_RULE_KEYS,
    'boost_rupees',
  ] as const;
  return keys.filter((key) =>
    key === 'tax_label' || key === 'tax_base'
      ? form[key].trim() !== before[key]
      : key === 'boost_rupees'
        ? parseBoostRupees(form[key]).minor.join() !== current.boost_options_minor.join()
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
        const { boost_options_minor: boost, ...rest } = cause.fieldErrors as Record<string, string>;
        setErrors({ ...(rest as FormErrors), ...(boost ? { boost_rupees: boost } : {}) });
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
      const next = await updateLivePricing(token, toBody(form));
      setSettings(next);
      setForm(toForm(next));
      setConfirming(false);
      setNotice(`Saved as version ${next.version}. New Live Work bookings use it; existing bookings keep their price and search rules.`);
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
          <p className="muted-copy">
            Live search &amp; retry: if no Worker accepts during a search, the Business can add one of the amounts below
            to the pay (per hour for hourly work, on the task price for task work) and search again, up to the number
            of searches set here. The add-on is billed on the final bill. With no choice in time, or after the last
            search, the Business is refunded in full. The Terms describe the current values, so update them too.
          </p>
          {field(
            'search_timeout_minutes',
            'Search time (minutes, 5–120)',
            <input aria-invalid={Boolean(errors.search_timeout_minutes)} inputMode="numeric" onChange={(e) => set('search_timeout_minutes', e.target.value)} value={form.search_timeout_minutes} />,
          )}
          {field(
            'max_search_rounds',
            'Searches per booking (1–5; 1 = no retry)',
            <input aria-invalid={Boolean(errors.max_search_rounds)} inputMode="numeric" onChange={(e) => set('max_search_rounds', e.target.value)} value={form.max_search_rounds} />,
          )}
          {field(
            'retry_choice_minutes',
            'Time to choose refund or search again (minutes, 2–60)',
            <input aria-invalid={Boolean(errors.retry_choice_minutes)} inputMode="numeric" onChange={(e) => set('retry_choice_minutes', e.target.value)} value={form.retry_choice_minutes} />,
          )}
          {field(
            'boost_rupees',
            'Add-on amounts in ₹ (comma separated, up to 5)',
            <input aria-invalid={Boolean(errors.boost_rupees)} onChange={(e) => set('boost_rupees', e.target.value)} placeholder="10, 20, 30" value={form.boost_rupees} />,
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
                  <td>{item.old_value == null ? '—' : auditValue(item.field, item.old_value)}</td>
                  <td>{auditValue(item.field, item.new_value)}</td>
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
