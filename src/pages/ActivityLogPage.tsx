import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { listRecords } from '@/api/adminResources';
import { ApiError } from '@/api/client';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { StatusBadge } from '@/components/StatusBadge';

type AuditEntry = {
  id: string;
  resource: string;
  record_id: string;
  action: 'create' | 'update' | 'delete';
  actor_user_id: string | null;
  old_values: string | null;
  new_values: string | null;
  created_at: string;
};

type ActivityLogPageProps = {
  token: string;
  onSessionExpired: () => void;
};

const PAGE_SIZE = 25;

const actionTone = {
  create: 'success',
  update: 'blue',
  delete: 'danger',
} as const;

function formatResource(resource: string) {
  const text = resource.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseValues(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function changedFields(entry: AuditEntry) {
  const before = parseValues(entry.old_values);
  const after = parseValues(entry.new_values);
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map(key => ({ key, before: before[key], after: after[key] }));
}

export function ActivityLogPage({ token, onSessionExpired }: ActivityLogPageProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await listRecords<AuditEntry>(token, 'admin_audit_log', {
        limit: PAGE_SIZE,
        offset,
        q: query || undefined,
        sort: '-created_at',
        filters: { action: action || undefined },
      });
      setEntries(page.items);
      setTotal(page.total);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired();
      else setError(cause instanceof Error ? cause.message : 'Could not load the activity log.');
    } finally {
      setLoading(false);
    }
  }, [action, offset, onSessionExpired, query, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOffset(0);
      setQuery(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <div className="eyebrow-row">
            <span className="eyebrow">AUDIT TRAIL</span>
            <span className="title-divider">/</span>
            <span className="eyebrow-sub">Admin changes</span>
          </div>
          <h1>Activity log</h1>
          <p className="page-description">
            Every change made to pricing, coupons, and cancellation rules, with values before and after.
          </p>
        </div>
        <button className="button button-secondary" disabled={loading} onClick={() => void load()} type="button">
          <RefreshCw size={15} />
          Refresh
        </button>
      </section>

      {error ? <div className="inline-error" role="alert">{error}</div> : null}

      <section className="panel activity-log-panel">
        <div className="activity-log-toolbar">
          <label className="activity-log-search">
            <Search size={14} />
            <input
              aria-label="Search activity"
              onChange={event => setSearch(event.target.value)}
              placeholder="Search by resource, record ID, or action"
              value={search}
            />
          </label>
          <select
            aria-label="Filter by action"
            onChange={event => {
              setOffset(0);
              setAction(event.target.value);
            }}
            value={action}
          >
            <option value="">All actions</option>
            <option value="create">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
          </select>
        </div>

        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr><th>When</th><th>Resource</th><th>Record</th><th>Action</th><th>Admin</th><th>Changes</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="empty-state"><LoadingIndicator label="Loading activity…" /></div></td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><strong>No activity yet</strong><span>Admin changes will appear here as they happen.</span></div></td></tr>
              ) : entries.map(entry => {
                const changes = changedFields(entry);
                const expanded = expandedId === entry.id;
                return [
                  <tr key={entry.id}>
                    <td>{formatTimestamp(entry.created_at)}</td>
                    <td className="table-primary-cell">{formatResource(entry.resource)}</td>
                    <td className="activity-log-mono">{entry.record_id}</td>
                    <td><StatusBadge tone={actionTone[entry.action] ?? 'neutral'}>{entry.action}</StatusBadge></td>
                    <td className="activity-log-mono">{entry.actor_user_id ? `${entry.actor_user_id.slice(0, 8)}…` : 'System'}</td>
                    <td>
                      {changes.length ? (
                        <button className="text-button" onClick={() => setExpandedId(expanded ? '' : entry.id)} type="button">
                          {expanded ? 'Hide' : `View ${changes.length} field${changes.length === 1 ? '' : 's'}`}
                        </button>
                      ) : '—'}
                    </td>
                  </tr>,
                  expanded ? (
                    <tr key={`${entry.id}-detail`} className="activity-log-detail-row">
                      <td colSpan={6}>
                        <table className="activity-log-diff">
                          <thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead>
                          <tbody>
                            {changes.map(change => (
                              <tr key={change.key}>
                                <td>{change.key}</td>
                                <td className="activity-log-before">{formatValue(change.before)}</td>
                                <td className="activity-log-after">{formatValue(change.after)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </div>

        <div className="activity-log-pagination">
          <span>{pageStart}–{pageEnd} of {total}</span>
          <div>
            <button
              aria-label="Previous page"
              className="button button-secondary"
              disabled={loading || offset === 0}
              onClick={() => setOffset(current => Math.max(0, current - PAGE_SIZE))}
              type="button"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              aria-label="Next page"
              className="button button-secondary"
              disabled={loading || offset + PAGE_SIZE >= total}
              onClick={() => setOffset(current => current + PAGE_SIZE)}
              type="button"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
