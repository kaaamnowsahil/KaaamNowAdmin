import { formatText } from '@/utils/text';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import type { SelectedRecord } from './ManagementPage';

type RecordDetailPageProps = {
  record: SelectedRecord;
  eyebrow: string;
  description: string;
  onBack: () => void;
  onToggleAccountStatus?: (userId: string, suspended: boolean) => void;
  accountStatusBusy?: boolean;
};

export function RecordDetailPage({
  record,
  eyebrow,
  description,
  onBack,
  onToggleAccountStatus,
  accountStatusBusy = false,
}: RecordDetailPageProps) {
  const toggleAccountStatus = () => {
    if (record.userId === undefined || record.accountIsActive === undefined) return;
    onToggleAccountStatus?.(record.userId, record.accountIsActive);
  };

  return (
    <div className="page-stack">
      <section className="page-title-row detail-page-heading">
        <div>
          <button className="text-action detail-back-button" onClick={onBack}>
            <ArrowLeft size={15} />
            {'Back to records'}
          </button>
          <div className="eyebrow-row">
            <span className="eyebrow">{eyebrow.toUpperCase()}</span>
            <span className="title-divider">/</span>
            <span className="eyebrow-sub">{record.subtitle}</span>
          </div>
          <h1>{record.title}</h1>
          <p className="page-description">{description}</p>
        </div>
      </section>

      <section className="detail-hero panel">
        <ProfileAvatar
          className="detail-hero-avatar"
          imageUrl={record.imageUrl}
          name={record.title}
        />
        <div className="detail-hero-copy">
          <span className="eyebrow">{formatText('{{type}} profile', { type: eyebrow.toLowerCase() })}</span>
          <h2>{record.title}</h2>
          <p>{record.subtitle}</p>
        </div>
        <span className="detail-open-label">
          <ArrowUpRight size={14} />
          {'Marketplace record'}
        </span>
        {record.userId && record.accountIsActive !== undefined && onToggleAccountStatus ? (
          <button
            className="detail-account-toggle"
            role="switch"
            aria-checked={record.accountIsActive}
            aria-label={`${record.accountIsActive ? 'Suspend' : 'Reactivate'} ${record.title}`}
            disabled={accountStatusBusy}
            onClick={toggleAccountStatus}
          >
            <span className="account-toggle-track" aria-hidden="true">
              {accountStatusBusy ? (
                <span className="loading-spinner detail-toggle-spinner" />
              ) : <span className="account-toggle-thumb" />}
            </span>
            <span>{accountStatusBusy ? 'Updating…' : record.accountIsActive ? 'Active' : 'Suspended'}</span>
          </button>
        ) : null}
      </section>

      <section className="detail-fields-grid" aria-label={formatText('{{type}} details', { type: eyebrow.toLowerCase() })}>
        {record.details.map((item, index) => (
          <article className="panel detail-field-card" key={`${item.label}-${index}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
