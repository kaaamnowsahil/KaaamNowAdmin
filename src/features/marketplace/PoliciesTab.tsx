import { type FormEvent, useCallback, useEffect, useState } from 'react';

import {
  activatePolicyVersion,
  createCancellationPolicyVersion,
  createPlatformFeePolicyVersion,
  getCancellationPolicies,
  getCancellationTiers,
  getPlatformFeePolicies,
  type CancellationPolicy,
  type CancellationTier,
  type PlatformFeePolicy,
} from '@/api/policies';

import { formatDate, rupees, useAdminCall, type TabProps } from './shared';

type Data = {
  cancellation: CancellationPolicy[];
  tiers: CancellationTier[];
  fees: PlatformFeePolicy[];
};

const hoursRange = (tier: CancellationTier) =>
  tier.hours_to == null ? `≥ ${Number(tier.hours_from)}h` : `${Number(tier.hours_from)}–${Number(tier.hours_to)}h`;

export function PoliciesTab({ token, onSessionExpired }: TabProps) {
  const { busy, error, run } = useAdminCall(onSessionExpired);
  const [data, setData] = useState<Data>({ cancellation: [], tiers: [], fees: [] });
  const [fee, setFee] = useState({ percentage: '', worker_percentage: '', gateway_percentage: '', notes: '' });
  const [thresholds, setThresholds] = useState({ strikes_to_limit: '', strikes_to_ban: '', limit_days: '', strike_window_days: '' });

  const load = useCallback(async () => {
    const next = await run(async () => {
      const [cancellation, tiers, fees] = await Promise.all([
        getCancellationPolicies(token),
        getCancellationTiers(token),
        getPlatformFeePolicies(token),
      ]);
      return { cancellation, tiers, fees };
    });
    if (next) setData(next);
  }, [run, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCancellation = data.cancellation.find((policy) => policy.is_active) ?? null;
  const activeFee = data.fees.find((policy) => policy.is_active) ?? null;
  const activeTiers = data.tiers.filter((tier) => tier.policy_version === activeCancellation?.version);

  const activate = async (
    resource: 'cancellation_policies' | 'platform_fee_policies',
    nextId: string,
    currentId: string | null,
  ) => {
    await run(() => activatePolicyVersion(token, resource, nextId, currentId));
    void load();
  };

  const createFee = async (event: FormEvent) => {
    event.preventDefault();
    const created = await run(() =>
      createPlatformFeePolicyVersion(token, {
        version: Math.max(0, ...data.fees.map((policy) => policy.version)) + 1,
        percentage: Number(fee.percentage),
        worker_percentage: Number(fee.worker_percentage),
        gateway_percentage: Number(fee.gateway_percentage),
        is_active: false,
        notes: fee.notes,
      }),
    );
    if (created) {
      setFee({ percentage: '', worker_percentage: '', gateway_percentage: '', notes: '' });
      void load();
    }
  };

  const createThresholds = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeCancellation) return;
    const { id: _id, created_at: _createdAt, ...base } = activeCancellation;
    const created = await run(() =>
      createCancellationPolicyVersion(
        token,
        {
          ...base,
          version: Math.max(0, ...data.cancellation.map((policy) => policy.version)) + 1,
          strikes_to_limit: Number(thresholds.strikes_to_limit || base.strikes_to_limit),
          strikes_to_ban: Number(thresholds.strikes_to_ban || base.strikes_to_ban),
          limit_days: Number(thresholds.limit_days || base.limit_days),
          strike_window_days: Number(thresholds.strike_window_days || base.strike_window_days),
          notes: `Copied from v${base.version}`,
        },
        activeTiers.map(({ id: _tierId, policy_version: _version, ...tier }) => tier),
      ),
    );
    if (created) {
      setThresholds({ strikes_to_limit: '', strikes_to_ban: '', limit_days: '', strike_window_days: '' });
      void load();
    }
  };

  return (
    <div className="page-stack">
      {error ? <div className="inline-error" role="alert">{error}</div> : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Platform fees</h2>
            <p>Only one version is active. New versions start inactive.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr><th>VERSION</th><th>BUSINESS COMMISSION</th><th>WORKER FEE</th><th>GATEWAY</th><th>NOTES</th><th>CREATED</th><th /></tr>
            </thead>
            <tbody>
              {data.fees.map((policy) => (
                <tr key={policy.id}>
                  <td className="table-primary-cell">v{policy.version}{policy.is_active ? ' · active' : ''}</td>
                  <td>{Number(policy.percentage)}%</td>
                  <td>{Number(policy.worker_percentage)}%</td>
                  <td>{Number(policy.gateway_percentage)}%</td>
                  <td>{policy.notes || '—'}</td>
                  <td>{formatDate(policy.created_at)}</td>
                  <td>
                    {!policy.is_active && (
                      <button className="text-button" disabled={busy} onClick={() => void activate('platform_fee_policies', policy.id, activeFee?.id ?? null)} type="button">
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="hold-form" onSubmit={(event) => void createFee(event)}>
          <label>Business commission %<input max={100} min={0} onChange={(event) => setFee({ ...fee, percentage: event.target.value })} required step="0.01" type="number" value={fee.percentage} /></label>
          <label>Worker fee %<input max={100} min={0} onChange={(event) => setFee({ ...fee, worker_percentage: event.target.value })} required step="0.01" type="number" value={fee.worker_percentage} /></label>
          <label>Gateway %<input max={100} min={0} onChange={(event) => setFee({ ...fee, gateway_percentage: event.target.value })} required step="0.01" type="number" value={fee.gateway_percentage} /></label>
          <label>Notes<input maxLength={500} onChange={(event) => setFee({ ...fee, notes: event.target.value })} value={fee.notes} /></label>
          <button className="secondary-button" disabled={busy} type="submit">Add fee version</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Cancellation policy {activeCancellation ? `v${activeCancellation.version}` : ''}</h2>
            <p>
              {activeCancellation
                ? `Strikes last ${activeCancellation.strike_window_days} days · fewer shifts from ${Number(activeCancellation.strikes_to_limit)} strikes for ${activeCancellation.limit_days} days · paused from ${Number(activeCancellation.strikes_to_ban)} strikes`
                : 'No active policy.'}
            </p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr><th>PARTY</th><th>EVENT</th><th>HOURS BEFORE</th><th>FLAT FEE</th><th>% OF BOOKING</th><th>CAP</th><th>TO WORKER</th><th>STRIKE</th><th>VOUCHER</th></tr>
            </thead>
            <tbody>
              {activeTiers.map((tier) => (
                <tr key={tier.id}>
                  <td>{tier.party}</td>
                  <td>{tier.event}</td>
                  <td>{hoursRange(tier)}</td>
                  <td>{rupees(tier.flat_fee_minor)}</td>
                  <td>{Number(tier.booking_pct)}%</td>
                  <td>{rupees(tier.fee_cap_minor)}</td>
                  <td>{Number(tier.worker_share_pct)}%</td>
                  <td>{Number(tier.strike_weight)}</td>
                  <td>{tier.business_voucher ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {activeCancellation && (
          <form className="hold-form" onSubmit={(event) => void createThresholds(event)}>
            <p className="muted-copy">New version copies the tiers above; blank fields keep the current value.</p>
            <label>Strike window (days)<input min={1} onChange={(event) => setThresholds({ ...thresholds, strike_window_days: event.target.value })} placeholder={String(activeCancellation.strike_window_days)} type="number" value={thresholds.strike_window_days} /></label>
            <label>Strikes to limit<input min={0.5} onChange={(event) => setThresholds({ ...thresholds, strikes_to_limit: event.target.value })} placeholder={String(Number(activeCancellation.strikes_to_limit))} step="0.5" type="number" value={thresholds.strikes_to_limit} /></label>
            <label>Limit days<input min={1} onChange={(event) => setThresholds({ ...thresholds, limit_days: event.target.value })} placeholder={String(activeCancellation.limit_days)} type="number" value={thresholds.limit_days} /></label>
            <label>Strikes to pause<input min={0.5} onChange={(event) => setThresholds({ ...thresholds, strikes_to_ban: event.target.value })} placeholder={String(Number(activeCancellation.strikes_to_ban))} step="0.5" type="number" value={thresholds.strikes_to_ban} /></label>
            <button className="secondary-button" disabled={busy} type="submit">Add policy version</button>
          </form>
        )}
        {data.cancellation.filter((policy) => !policy.is_active).map((policy) => (
          <p className="muted-copy" key={policy.id}>
            v{policy.version} · {policy.notes || 'no notes'} ·{' '}
            <button className="text-button" disabled={busy} onClick={() => void activate('cancellation_policies', policy.id, activeCancellation?.id ?? null)} type="button">
              Activate
            </button>
          </p>
        ))}
      </section>
    </div>
  );
}
