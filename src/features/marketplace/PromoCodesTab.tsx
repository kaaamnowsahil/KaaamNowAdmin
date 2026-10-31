import { type FormEvent, useCallback, useState } from 'react';

import {
  createPromoCode,
  getPromoCodes,
  isShiftCoupon,
  setPromoCodeActive,
  type PromoCode,
  type PromoCodeInput,
} from '@/api/promoCodes';

import { formatDate, rupees, useAdminList, type TabProps } from './shared';

export type PromoForm = PromoCodeInput & { capRupees: string; minRupees: string };

const EMPTY: PromoForm = {
  code: '',
  title: '',
  target_role: 'business',
  booking_types: 'all',
  discount_type: 'waive_fees',
  discount_value: 0,
  applies_to: 'all_fees',
  max_discount_minor: null,
  min_booking_minor: null,
  valid_until: null,
  max_uses: null,
  max_uses_per_user: 1,
  is_listed: false,
  capRupees: '',
  minRupees: '',
};

const SHIFT_EMPTY: PromoForm = { ...EMPTY, booking_types: 'shift' };

const APPLIES_TO_LABEL: Record<PromoCode['applies_to'], string> = {
  all_fees: 'platform charge + payment gateway charge',
  commission: 'platform charge',
  gateway: 'payment gateway charge',
};

const BOOKING_LABEL: Record<PromoCode['booking_types'], string> = {
  all: 'Shift + Live Work',
  shift: 'Shift',
  live: 'Live Work',
};

const toMinor = (rupeesText: string) => (rupeesText.trim() ? Math.round(Number(rupeesText) * 100) : null);

/** Request body for a new code; worker codes discount payouts, so booking targeting is ignored. */
export function buildPromoInput(form: PromoForm): PromoCodeInput {
  const forBusiness = form.target_role === 'business';
  return {
    code: form.code.trim().toUpperCase(),
    title: form.title.trim(),
    target_role: form.target_role,
    booking_types: forBusiness ? form.booking_types : 'all',
    discount_type: form.discount_type,
    discount_value: form.discount_type === 'waive_fees' ? 0 : Number(form.discount_value),
    applies_to: form.applies_to,
    max_discount_minor: toMinor(form.capRupees),
    min_booking_minor: forBusiness ? toMinor(form.minRupees) : null,
    valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
    max_uses: form.max_uses,
    max_uses_per_user: form.max_uses_per_user,
    is_listed: forBusiness && form.is_listed,
  };
}

function discountLabel(promo: PromoCode) {
  const target = APPLIES_TO_LABEL[promo.applies_to];
  if (promo.discount_type === 'waive_fees') return `Waive ${target}`;
  if (promo.discount_type === 'percent') return `${Number(promo.discount_value)}% off ${target}`;
  return `${rupees(Number(promo.discount_value) * 100)} off ${target}`;
}

type PromoCodesTabProps = TabProps & {
  /** `shift`: only Business coupons usable on Shift bookings. */
  scope?: 'all' | 'shift';
};

export function PromoCodesTab({ token, onSessionExpired, scope = 'all' }: PromoCodesTabProps) {
  const isShift = scope === 'shift';
  const blank = isShift ? SHIFT_EMPTY : EMPTY;
  const load = useCallback(
    async () => (await getPromoCodes(token)).filter((promo) => !isShift || isShiftCoupon(promo)),
    [isShift, token],
  );
  const list = useAdminList(load, onSessionExpired);
  const [form, setForm] = useState<PromoForm>(blank);
  const set = <K extends keyof PromoForm>(key: K, value: PromoForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const forBusiness = form.target_role === 'business';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await list.run(() => createPromoCode(token, buildPromoInput(form)))) {
      setForm(blank);
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
            <h2>{isShift ? 'New Shift coupon' : 'New promo code'}</h2>
            <p>
              {isShift
                ? 'Businesses apply these at Shift checkout. Coupons only reduce the platform charge and payment gateway charge, never worker pay.'
                : 'Business codes discount fees on a booking; worker codes apply to the next payout.'}
            </p>
          </div>
        </div>
        <form className="hold-form" onSubmit={(event) => void submit(event)}>
          <label>
            Code
            <input maxLength={32} onChange={(event) => set('code', event.target.value)} required value={form.code} />
          </label>
          <label>
            Title <span className="field-hint">(shown to Businesses)</span>
            <input maxLength={80} onChange={(event) => set('title', event.target.value)} value={form.title} />
          </label>
          {!isShift && (
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
          )}
          {forBusiness && (
            <label>
              Bookings
              <select
                onChange={(event) => set('booking_types', event.target.value as PromoCode['booking_types'])}
                value={form.booking_types}
              >
                <option value="shift">Shift only</option>
                <option value="all">Shift + Live Work</option>
                {!isShift && <option value="live">Live Work only</option>}
              </select>
            </label>
          )}
          <label>
            Discount
            <select
              onChange={(event) => set('discount_type', event.target.value as PromoCode['discount_type'])}
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
              <option value="all_fees">Platform charge + payment gateway charge</option>
              <option value="commission">Platform charge only</option>
              <option value="gateway">Payment gateway charge only</option>
            </select>
          </label>
          <label>
            Max discount (₹) <span className="field-hint">(optional)</span>
            <input min={0} onChange={(event) => set('capRupees', event.target.value)} type="number" value={form.capRupees} />
          </label>
          {forBusiness && (
            <label>
              Minimum worker pay (₹) <span className="field-hint">(optional)</span>
              <input min={0} onChange={(event) => set('minRupees', event.target.value)} type="number" value={form.minRupees} />
            </label>
          )}
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
              onChange={(event) => set('max_uses', event.target.value ? Number(event.target.value) : null)}
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
          {forBusiness && (
            <label className="checkbox-row">
              <input checked={form.is_listed} onChange={(event) => set('is_listed', event.target.checked)} type="checkbox" />
              Show on the Business Promotions screen
            </label>
          )}
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
                {!isShift && <th>FOR</th>}
                <th>BOOKINGS</th>
                <th>DISCOUNT</th>
                <th>CAP</th>
                <th>MIN PAY</th>
                <th>USED</th>
                <th>VALID UNTIL</th>
                <th>LISTED</th>
                <th>SOURCE</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.items.map((promo) => (
                <tr key={promo.id}>
                  <td className="table-primary-cell">
                    {promo.code}
                    {promo.title ? <small className="muted-copy"> · {promo.title}</small> : null}
                  </td>
                  {!isShift && <td>{promo.target_role}</td>}
                  <td>{promo.target_role === 'business' ? BOOKING_LABEL[promo.booking_types] : 'Payout'}</td>
                  <td>{discountLabel(promo)}</td>
                  <td>{rupees(promo.max_discount_minor)}</td>
                  <td>{rupees(promo.min_booking_minor)}</td>
                  <td>{`${promo.used_count}${promo.max_uses ? ` / ${promo.max_uses}` : ''}`}</td>
                  <td>{formatDate(promo.valid_until)}</td>
                  <td>{promo.is_listed ? 'Yes' : promo.owner_user_id ? 'One business' : '—'}</td>
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
          {!list.busy && list.items.length === 0 ? (
            <p className="empty-state">{isShift ? 'No Shift coupons yet.' : 'No promo codes yet.'}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
