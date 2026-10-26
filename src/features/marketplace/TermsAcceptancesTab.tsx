import { useCallback, useState } from 'react';

import { getTermsAcceptances } from '@/api/promoCodes';

import { formatDate, useAdminList, type TabProps } from './shared';

export function TermsAcceptancesTab({ token, onSessionExpired }: TabProps) {
  const load = useCallback(() => getTermsAcceptances(token), [token]);
  const list = useAdminList(load, onSessionExpired);
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const rows = needle
    ? list.items.filter((row) => `${row.user_id} ${row.audience} ${row.version}`.toLowerCase().includes(needle))
    : list.items;

  return (
    <div className="page-stack">
      <div className="deletion-toolbar">
        <label>
          Search
          <input onChange={(event) => setSearch(event.target.value)} placeholder="User ID, audience or version" value={search} />
        </label>
        <span className="muted-copy">{`${rows.length} acceptance${rows.length === 1 ? '' : 's'}`}</span>
      </div>
      {list.error ? <div className="inline-error" role="alert">{list.error}</div> : null}
      <section className="panel">
        <div className="table-scroll">
          <table className="admin-table">
            <thead><tr><th>USER</th><th>ROLE</th><th>TERMS VERSION</th><th>ACCEPTED</th><th>IP</th><th>DEVICE</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="table-primary-cell">{row.user_id}</td>
                  <td>{row.audience}</td>
                  <td>{row.version}</td>
                  <td>{formatDate(row.accepted_at)}</td>
                  <td>{row.ip_address ?? '—'}</td>
                  <td>{row.user_agent ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.busy && rows.length === 0 ? <p className="empty-state">No acceptances recorded.</p> : null}
        </div>
      </section>
    </div>
  );
}
