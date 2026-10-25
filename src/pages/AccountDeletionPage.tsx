import { ArrowLeft, Clock3, RefreshCw, ShieldAlert, UserRound } from 'lucide-react';

import type { DeletionStatus, HoldBasis } from '@/api/accountDeletion';
import { AppLoader } from '@/components/AppLoader';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { useAccountDeletion } from '@/features/account-deletion/useAccountDeletion';

const statusLabels: Record<DeletionStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  on_hold: 'On hold',
  completed: 'Completed',
};

const holdBases: { value: HoldBasis; label: string }[] = [
  { value: 'pending_booking', label: 'Pending booking' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'dispute', label: 'Dispute' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'legal_obligation', label: 'Legal obligation' },
  { value: 'fraud_investigation', label: 'Fraud investigation' },
];

type AccountDeletionPageProps = {
  token: string;
  onSessionExpired: () => void;
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function AccountDeletionPage({ token, onSessionExpired }: AccountDeletionPageProps) {
  const {
    addHold,
    approve,
    basis,
    busy,
    busyAction,
    detail,
    detailLoading,
    error,
    expiresOn,
    loadQueue,
    loading,
    maxExpiry,
    minExpiry,
    notice,
    offset,
    queue,
    reason,
    reference,
    releaseHold,
    selectedId,
    selectedRequest,
    setBasis,
    setDetail,
    setExpiresOn,
    setOffset,
    setReason,
    setReference,
    setSelectedId,
    setStatus,
    status,
    total,
  } = useAccountDeletion({ token, onSessionExpired });

  return (
    <section className="deletion-page">
      <header className="page-heading deletion-heading">
        <div>
          <p className="eyebrow">PRIVACY OPERATIONS</p>
          <h1>Account deletion requests</h1>
          <p>Review requests, verify blockers, and record auditable decisions.</p>
        </div>
        <button className="secondary-button" onClick={() => void loadQueue()} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      <div className="deletion-toolbar">
        <label>
          Queue status
          <select value={status} onChange={event => { setStatus(event.target.value as DeletionStatus); setOffset(0); setSelectedId(''); }}>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <span className="muted-copy">{loading ? null : `${total} ${total === 1 ? 'request' : 'requests'}`}</span>
      </div>

      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {notice ? <div className="inline-notice" role="status">{notice}</div> : null}

      <div className="deletion-workspace">
        <section className="deletion-queue panel">
          <div className="panel-heading">
            <div><h2>{statusLabels[status]}</h2><p>Server-managed review queue</p></div>
            <span className="queue-count">{total}</span>
          </div>
          {loading ? <AppLoader label="Loading requests…" /> : queue.length === 0 ? (
            <p className="empty-state">No requests in this queue.</p>
          ) : queue.map(request => (
            <button
              key={request.id}
              className={`deletion-queue-item ${selectedId === request.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(request.id)}
            >
              <span className="deletion-avatar"><UserRound size={17} /></span>
              <span className="deletion-queue-copy">
                <strong>{request.full_name || request.phone}</strong>
                <small>{request.phone} · Requested {formatDate(request.requested_at)}</small>
                <span className="deletion-flags">
                  {request.blockers.length ? <em className="flag-danger">{request.blockers.length} blocker{request.blockers.length === 1 ? '' : 's'}</em> : null}
                  {request.holds.length ? <em className="flag-warning">{request.holds.length} active hold{request.holds.length === 1 ? '' : 's'}</em> : null}
                </span>
              </span>
              <span className={`status-badge deletion-status status-${request.status}`}>{statusLabels[request.status]}</span>
            </button>
          ))}
          <div className="queue-pagination">
            <button className="secondary-button" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - 50))}>Previous</button>
            <span>{total ? `${offset + 1}–${Math.min(offset + 50, total)} of ${total}` : '0 results'}</span>
            <button className="secondary-button" disabled={offset + 50 >= total || loading} onClick={() => setOffset(offset + 50)}>Next</button>
          </div>
        </section>

        <section className="deletion-detail panel">
          {detailLoading ? <AppLoader label="Loading request details…" /> : !selectedRequest ? (
            <div className="empty-state"><ShieldAlert size={24} /><strong>Select a request to review</strong><span>Details and audit history are fetched from the admin API.</span></div>
          ) : (
            <>
              <div className="detail-heading">
                <div className="detail-person">
                  <span className="deletion-avatar large"><UserRound size={20} /></span>
                  <div><p className="eyebrow">REQUEST {selectedRequest.id}</p><h2>{selectedRequest.full_name || 'Account holder'}</h2><span>{selectedRequest.phone}</span></div>
                </div>
                <button className="back-to-queue" onClick={() => { setSelectedId(''); setDetail(null); }}><ArrowLeft size={14} /> Queue</button>
              </div>
              <div className="deletion-facts">
                <div><small>User ID</small><strong>{selectedRequest.user_id}</strong></div>
                <div><small>Roles</small><strong>{selectedRequest.roles?.join(', ') || '—'}</strong></div>
                <div><small>Requested</small><strong>{formatDate(selectedRequest.requested_at)}</strong></div>
                <div><small>Approved</small><strong>{formatDate(selectedRequest.approved_at)}</strong></div>
                <div><small>Completed</small><strong>{formatDate(selectedRequest.completed_at)}</strong></div>
              </div>
              <div className="review-section">
                <div className="section-title"><ShieldAlert size={16} /><h3>Blockers</h3></div>
                {selectedRequest.blockers.length ? <ul className="blocker-list">{selectedRequest.blockers.map((blocker, index) => <li key={`${blocker}-${index}`}>{blocker}</li>)}</ul> : <p className="clear-blockers">No blockers reported by the server.</p>}
              </div>
              <div className="review-section">
                <div className="section-title"><Clock3 size={16} /><h3>Holds</h3></div>
                {selectedRequest.holds.length ? selectedRequest.holds.map(hold => {
                  const expired = new Date(hold.expires_at).getTime() <= Date.now();
                  return (
                    <div className="hold-card" key={hold.id}>
                      <div><strong>{holdBases.find(item => item.value === hold.basis)?.label ?? hold.basis}</strong><span className={expired ? 'hold-expired' : ''}>{expired ? 'Expired' : 'Expires'} {formatDate(hold.expires_at)}</span></div>
                      <p>{hold.reason}</p>
                      <small>Reference: {hold.reference || 'Not provided'}</small>
                      <button className="text-button danger-text" disabled={busy} onClick={() => void releaseHold(hold.id)}>
                        {busyAction === hold.id ? <LoadingIndicator label="Releasing…" className="loading-indicator-compact" /> : 'Release hold'}
                      </button>
                    </div>
                  );
                }) : <p className="muted-copy">No holds recorded.</p>}
              </div>
              {selectedRequest.status !== 'completed' ? (
                <div className="review-actions">
                  <div className="section-title"><Clock3 size={16} /><h3>Add a bounded hold</h3></div>
                  <form className="hold-form" onSubmit={event => void addHold(event)}>
                    <label>Basis<select value={basis} onChange={event => setBasis(event.target.value as HoldBasis)}>{holdBases.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                    <label>Reason<textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} placeholder="Explain why the request must be held" /></label>
                    <label>Reference <span className="field-hint">(optional)</span><input maxLength={160} value={reference} onChange={event => setReference(event.target.value)} placeholder="Booking, payment, case, or legal reference" /></label>
                    <label>Hold expiry <span className="field-hint">(required, maximum 30 days)</span><input required type="date" min={minExpiry} max={maxExpiry} value={expiresOn} onChange={event => setExpiresOn(event.target.value)} /></label>
                    <button className="secondary-button" type="submit" disabled={busy || !reason.trim() || !expiresOn}>{busyAction === 'add-hold' ? <LoadingIndicator label="Saving…" className="loading-indicator-compact" /> : 'Record hold'}</button>
                  </form>
                  <div className="approve-row">
                    <p>Approval is available only when the server reports no blockers.</p>
                    <button className="primary-button" disabled={busy || selectedRequest.blockers.length > 0 || selectedRequest.status !== 'pending'} onClick={() => void approve()}>
                      {busyAction === 'approve' ? <LoadingIndicator label="Deleting…" className="loading-indicator-compact" /> : 'Approve deletion request'}
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="review-section audit-section">
                <div className="section-title"><Clock3 size={16} /><h3>Audit history</h3></div>
                {detail?.audit_events.length ? detail.audit_events.map((event, index) => (
                  <div className="audit-event" key={event.id ?? `${event.created_at ?? event.occurred_at}-${index}`}>
                    <strong>{event.event ?? event.action ?? 'Request event'}</strong>
                    <span>{event.actor ?? event.actor_id ?? 'System'} · {formatDate(event.created_at ?? event.occurred_at)}</span>
                    {event.details ? <p>{typeof event.details === 'string' ? event.details : JSON.stringify(event.details)}</p> : null}
                  </div>
                )) : <p className="muted-copy">No audit events returned.</p>}
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
