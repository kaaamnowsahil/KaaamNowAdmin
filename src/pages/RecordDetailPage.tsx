import { ArrowLeft, ArrowUpRight } from 'lucide-react';

import type { SelectedRecord } from './ManagementPage';

type RecordDetailPageProps = {
  record: SelectedRecord;
  eyebrow: string;
  description: string;
  onBack: () => void;
};

export function RecordDetailPage({
  record,
  eyebrow,
  description,
  onBack,
}: RecordDetailPageProps) {
  return (
    <div className="page-stack">
      <section className="page-title-row detail-page-heading">
        <div>
          <button className="text-action detail-back-button" onClick={onBack}>
            <ArrowLeft size={15} />
            Back to records
          </button>
          <div className="eyebrow-row">
            <span className="eyebrow">{eyebrow}</span>
            <span className="title-divider">/</span>
            <span className="eyebrow-sub">{record.subtitle}</span>
          </div>
          <h1>{record.title}</h1>
          <p className="page-description">{description}</p>
        </div>
      </section>

      <section className="detail-hero panel">
        <span className="detail-hero-avatar">
          {record.title
            .split(/\s+/)
            .slice(0, 2)
            .map(word => word[0])
            .join('')
            .toUpperCase()}
        </span>
        <div className="detail-hero-copy">
          <span className="eyebrow">{eyebrow} PROFILE</span>
          <h2>{record.title}</h2>
          <p>{record.subtitle}</p>
        </div>
        <span className="detail-open-label">
          <ArrowUpRight size={14} />
          Marketplace record
        </span>
      </section>

      <section className="detail-fields-grid" aria-label={`${eyebrow} details`}>
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
