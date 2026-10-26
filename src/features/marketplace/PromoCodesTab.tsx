import { type FormEvent, useCallback, useState } from 'react';

import {
  createPromoCode,
  getPromoCodes,
  setPromoCodeActive,
  type PromoCode,
  type PromoCodeInput,
} from '@/api/promoCodes';

import { formatDate, rupees, useAdminList, type TabProps } from './shared';

const EMPTY: PromoCodeInput = {
  code: '',
  target_role: 'business',
  discount_type: 'waive_fees',
  discount_value: 0,
  applies_to: 'all_fees',
  max_discount_minor: null,
  valid_until: null,
  max_uses: null,
  max_uses_per_user: 1,
};

function discountLabel(promo: PromoCode) {
  if (promo.discount_type === 'waive_fees') return `Waive ${promo.applies_to.replace('_', ' ')}`;
  if (promo.discount_type === 'percent') return `${Number(promo.discount_value)}% off ${promo.applies_to}`;
  return `${rupees(Number(promo.discount_value) * 100)} off ${promo.applies_to}`;
}

export function PromoCodesTab({ token, onSessionExpired }: TabProps) {
  const load = useCallback(() => getPromoCodes(token), [token]);
  const list = useAdminList(load, onSessionExpired);
  const [form, setForm] = useState<PromoCodeInput>(EMPTY);
  const [capRupees, setCapRupees] = useState('');
  const set = <K extends keyof PromoCodeInput>(key: K, value: PromoCodeInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const created = await list.run(() =>
      createPromoCode(token, {
        ...form,
        code: form.code.trim().toUpperCase(),
        discount_value: form.discount_type === 'waive_fees' ? 0 : Number(form.discount_value),
        max_discount_minor: capRupees ? Math.round(Number(capRupees) * 100) : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      }),
    );
    if (created) {
      setForm(EMPTY);
      setCapRupees('');
      void list.reload();
    }
  };

  const toggle = async (promo: PromoCode) => {
    if (await list.run(() => setPromoCodeActive(token, promo.id, !promo.is_active))) {
      void list.reload();
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>New promo code</h2>
            <p>Business codes discount fees on a posting; worker codes apply to the next payout.</p>
          </div>
        </div>
        <form className="hold-form" onSubmit={(event) => void submit(event)}>
          <label>
            Code
            <input
              maxLength={32}
              onChange={(event) => set('code', event.target.value)}
              required
              value={form.code}
            />
          </label>
          <label>
            For
            <select
              onChange={(event) => set('target_role', event.target.value as PromoCode['target_role'])}
              value={form.target_role}
            >
              <option value="business">Business / Work</option>
              <option value="worker">Worker</option>
            </select>
          </label>
          <label>
            Discount
            <select
              onChange={(event) =>
                set('discount_type', event.target.value as PromoCode['discount_type'])
              }
              value={form.discount_type}
            >
              <option value="waive_fees">Waive fees</option>
              <option value="percent">Percent off fees</option>
              <option value="flat">Flat ₹ off fees</option>
            </select>
          </label>
          {form.discount_type !== 'waive_fees' && (
            <label>
              {form.discount_type === 'percent' ? 'Percent' : 'Amount (₹)'}
              <input
                min={0}
                max={form.discount_type === 'percent' ? 100 : undefined}
                onChange={(event) => set('discount_value', event.target.value)}
                required
                step="0.01"
                type="number"
                value={form.discount_value}
              />
            </label>
          )}
          <label>
            Applies to
            <select
              onChange={(event) => set('applies_to', event.target.value as PromoCode['applies_to'])}
              value={form.applies_to}
            >
              <option value="all_fees">All fees</option>
              <option value="commission">Commission only</option>
              <option value="gateway">Gateway fee only</option>
            </select>
          </label>
          <label>
            Max discount (₹) <span className="field-hint">(optional)</span>
            <input
              min={0}
              onChange={(event) => setCapRupees(event.target.value)}
              type="number"
              value={capRupees}
            />
          </label>
          <label>
            Valid until <span className="field-hint">(optional)</span>
            <input
              onChange={(event) => set('valid_until', event.target.value || null)}
              type="date"
              value={form.valid_until ?? ''}
            />
          </label>
          <label>
            Total uses <span className="field-hint">(blank = unlimited)</span>
            <input
              min={1}
              onChange={(event) =>
                set('max_uses', event.target.value ? Number(event.target.value) : null)
              }
              type="number"
              value={form.max_uses ?? ''}
            />
          </label>
          <label>
            Uses per user
            <input
              min={1}
              onChange={(event) => set('max_uses_per_user', Number(event.target.value) || 1)}
              type="number"
              value={form.max_uses_per_user}
            />
          </label>
          <button className="primary-button" disabled={list.busy || !form.code.trim()} type="submit">
            Create code
          </button>
        </form>
      </section>

      {list.error ? <div className="inline-error" role="alert">{list.error}</div> : null}

      <section className="panel">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>CODE</th>
                <th>FOR</th>
                <th>DISCOUNT</th>
                <th>CAP</th>
                <th>USED</th>
                <th>VALID UNTIL</th>
                <th>SOURCE</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.items.map((promo) => (
                <tr key={promo.id}>
                  <td className="table-primary-cell">{promo.code}</td>
                  <td>{promo.target_role}</td>
                  <td>{discountLabel(promo)}</td>
                  <td>{rupees(promo.max_discount_minor)}</td>
                  <td>{`${promo.used_count}${promo.max_uses ? ` / ${promo.max_uses}` : ''}`}</td>
                  <td>{formatDate(promo.valid_until)}</td>
                  <td>{promo.source}</td>
                  <td>
                    <button
                      className={`text-button${promo.is_active ? ' danger-text' : ''}`}
                      disabled={list.busy}
                      onClick={() => void toggle(promo)}
                      type="button"
                    >
                      {promo.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.busy && list.items.length === 0 ? <p className="empty-state">No promo codes yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
