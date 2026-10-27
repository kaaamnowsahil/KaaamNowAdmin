import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react';

import {
  activatePolicyVersion,
  createPlatformFeePolicyVersion,
  getPlatformFeePolicies,
  type PlatformFeePolicy,
} from '@/api/policies';

import { percentError, TAX_BASE_LABEL, type TaxBase } from './livePricingMath';
import { formatDate, rupees, useAdminCall, type TabProps } from './shared';
import { previewShiftCharge } from './shiftPricingMath';

type Form = {
  percentage: string;
  worker_percentage: string;
  gateway_percentage: string;
  tax_percentage: string;
  tax_label: string;
  tax_base: TaxBase;
  notes: string;
};
type FormErrors = Partial<Record<keyof Form, string>>;

const PERCENT_FIELDS = ['percentage', 'worker_percentage', 'gateway_percentage', 'tax_percentage'] as const;
const EXAMPLE_PAY_MINOR = 100_000;
const EMPTY: Form = {
  percentage: '',
  worker_percentage: '',
  gateway_percentage: '',
  tax_percentage: '',
  tax_label: 'Tax',
  tax_base: 'subtotal',
  notes: '',
};

const toForm = (policy: PlatformFeePolicy): Form => ({
  percentage: String(Number(policy.percentage)),
  worker_percentage: String(Number(policy.worker_percentage)),
  gateway_percentage: String(Number(policy.gateway_percentage)),
  tax_percentage: String(Number(policy.tax_percentage)),
  tax_label: policy.tax_label,
  tax_base: policy.tax_base,
  notes: '',
});

export function validateShiftRates(form: Form): FormErrors {
  const errors: FormErrors = {};
  for (const key of PERCENT_FIELDS) {
    const message = percentError(form[key]);
    if (message) errors[key] = message;
  }
  if (!form.tax_label.trim()) errors.tax_label = 'Required.';
  else if (form.tax_label.trim().length > 40) errors.tax_label = 'At most 40 characters.';
  if (!form.notes.trim()) errors.notes = 'Say why the rates are changing.';
  return errors;
}

/** Commission, worker fee, transaction charge and tax for Shift bookings (versioned). */
export function ShiftPricingTab({ token, onSessionExpired }: TabProps) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [policies, setPolicies] = useState<PlatformFeePolicy[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState('');

  const active = policies.find((policy) => policy.is_active) ?? null;

  const load = useCallback(async () => {
    const next = await run(() => getPlatformFeePolicies(token));
    if (next) {
      setPolicies(next);
      const current = next.find((policy) => policy.is_active);
      setForm(current ? toForm(current) : EMPTY);
    }
  }, [run, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setConfirming(false);
    setNotice('');
  };

  const review = (event: FormEvent) => {
    event.preventDefault();
    const found = validateShiftRates(form);
    setErrors(found);
    setConfirming(Object.keys(found).length === 0);
  };

  const activateVersion = (policy: PlatformFeePolicy) =>
    run(async () => {
      await activatePolicyVersion(token, 'platform_fee_policies', policy.id, active?.id ?? null);
      return true;
    });

  const save = async (activate: boolean) => {
    const created = await run(() =>
      createPlatformFeePolicyVersion(token, {
        version: Math.max(0, ...policies.map((policy) => policy.version)) + 1,
        percentage: Number(form.percentage),
        worker_percentage: Number(form.worker_percentage),
        gateway_percentage: Number(form.gateway_percentage),
        tax_percentage: Number(form.tax_percentage),
        tax_label: form.tax_label.trim(),
        tax_base: form.tax_base,
        is_active: false,
        notes: form.notes.trim(),
      }),
    );
    if (!created) return;
    setConfirming(false);
    if (!activate) {
      setNotice(`Version ${created.version} saved (inactive).`);
    } else if (await activateVersion(created)) {
      setNotice(`Version ${created.version} is now active for newly published shifts.`);
    } else {
      setPolicies((current) => [created, ...current]);
      return;
    }
    void load();
  };

  const activateExisting = async (policy: PlatformFeePolicy) => {
    if (await activateVersion(policy)) {
      setNotice(`Version ${policy.version} is now active for newly published shifts.`);
      void load();
    }
  };

  const ratesValid = PERCENT_FIELDS.every((key) => !percentError(form[key]));
  const example = ratesValid
    ? previewShiftCharge(EXAMPLE_PAY_MINOR, {
        businessPct: Number(form.percentage),
        workerPct: Number(form.worker_percentage),
        gatewayPct: Number(form.gateway_percentage),
        taxPct: Number(form.tax_percentage),
        taxBase: form.tax_base,
      })
    : null;

  const field = (key: keyof Form, label: string, input: ReactNode) => (
    <label>
      {label}
      {input}
      {errors[key] ? <span className="field-error" role="alert">{errors[key]}</span> : null}
    </label>
  );
  const percentInput = (key: (typeof PERCENT_FIELDS)[number]) => (
    <input aria-invalid={Boolean(errors[key])} inputMode="decimal" onChange={(e) => set(key, e.target.value)} value={form[key]} />
  );

  return (
    <div className="page-stack">
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Shift Pricing &amp; Charges{active ? ` · v${active.version}` : ''}</h2>
            <p>
              {active
                ? `Active since ${formatDate(active.created_at)}. `
                : 'No active version: shifts cannot be published until one is activated. '}
              Rates are copied onto each shift when it is published, so changes never alter shifts that are
              already live or booked.
            </p>
          </div>
        </div>
        <form className="hold-form" noValidate onSubmit={review}>
          {field('percentage', 'Business commission %', percentInput('percentage'))}
          {field('worker_percentage', 'Worker commission % (deducted from pay)', percentInput('worker_percentage'))}
          {field('gateway_percentage', 'Transaction charge % (on pay + commission)', percentInput('gateway_percentage'))}
          {field('tax_percentage', 'Tax %', percentInput('tax_percentage'))}
          {field(
            'tax_label',
            'Tax label (shown to Businesses)',
            <input aria-invalid={Boolean(errors.tax_label)} maxLength={40} onChange={(e) => set('tax_label', e.target.value)} value={form.tax_label} />,
          )}
          {field(
            'tax_base',
            'Tax applied to',
            <select onChange={(e) => set('tax_base', e.target.value as TaxBase)} value={form.tax_base}>
              {(Object.keys(TAX_BASE_LABEL) as TaxBase[]).map((base) => (
                <option key={base} value={base}>{TAX_BASE_LABEL[base]}</option>
              ))}
            </select>,
          )}
          {field(
            'notes',
            'Reason for change',
            <input aria-invalid={Boolean(errors.notes)} maxLength={200} onChange={(e) => set('notes', e.target.value)} value={form.notes} />,
          )}
          {!confirming && <button className="primary-button" disabled={busy} type="submit">Review changes</button>}
        </form>
        {confirming && (
          <div className="hold-form" role="alertdialog" aria-label="Confirm Shift pricing change">
            <p>
              This creates version {Math.max(0, ...policies.map((policy) => policy.version)) + 1}. Activating it
              applies to shifts published from now on.
            </p>
            <button className="primary-button" disabled={busy} onClick={() => void save(true)} type="button">Save and activate</button>
            <button className="secondary-button" disabled={busy} onClick={() => void save(false)} type="button">Save inactive</button>
            <button className="text-button" disabled={busy} onClick={() => setConfirming(false)} type="button">Back</button>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Example: ₹1,000 worker pay</h2>
            <p>Computed with the same rounding as the server, before any coupon.</p>
          </div>
        </div>
        {example ? (
          <div className="table-scroll">
            <table className="admin-table">
              <tbody>
                <tr><td>Worker pay</td><td>{rupees(example.base)}</td></tr>
                <tr><td>Business commission</td><td>{rupees(example.commission)}</td></tr>
                <tr><td>Transaction charge</td><td>{rupees(example.gateway)}</td></tr>
                <tr><td>{form.tax_label || 'Tax'} on {rupees(example.taxable)}</td><td>{rupees(example.tax)}</td></tr>
                <tr><td className="table-primary-cell">Business pays</td><td className="table-primary-cell">{rupees(example.businessTotal)}</td></tr>
                <tr><td>Worker commission</td><td>−{rupees(example.workerFee)}</td></tr>
                <tr><td className="table-primary-cell">Worker receives</td><td className="table-primary-cell">{rupees(example.workerNet)}</td></tr>
                <tr><td>Platform commission (business + worker)</td><td>{rupees(example.platformEarns)}</td></tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted-copy">Enter valid percentages to see the example.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Versions</h2>
            <p>Only one version is active at a time.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr><th>VERSION</th><th>BUSINESS</th><th>WORKER</th><th>TRANSACTION</th><th>TAX</th><th>NOTES</th><th>CREATED</th><th /></tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id}>
                  <td className="table-primary-cell">v{policy.version}{policy.is_active ? ' · active' : ''}</td>
                  <td>{Number(policy.percentage)}%</td>
                  <td>{Number(policy.worker_percentage)}%</td>
                  <td>{Number(policy.gateway_percentage)}%</td>
                  <td>{`${Number(policy.tax_percentage)}% ${policy.tax_label} · ${TAX_BASE_LABEL[policy.tax_base]}`}</td>
                  <td>{policy.notes || '—'}</td>
                  <td>{formatDate(policy.created_at)}</td>
                  <td>
                    {!policy.is_active && (
                      <button className="text-button" disabled={busy} onClick={() => void activateExisting(policy)} type="button">
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!busy && policies.length === 0 ? <p className="empty-state">No fee versions yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
