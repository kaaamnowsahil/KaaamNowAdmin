import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { SelectedRecord } from './ManagementPage';
import { translateText } from '@/i18n';

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
  const { t } = useTranslation();
  return (
    <div className="page-stack">
      <section className="page-title-row detail-page-heading">
        <div>
          <button className="text-action detail-back-button" onClick={onBack}>
            <ArrowLeft size={15} />
            {t('Back to records')}
          </button>
          <div className="eyebrow-row">
            <span className="eyebrow">{t(eyebrow.toLowerCase()).toUpperCase()}</span>
            <span className="title-divider">/</span>
            <span className="eyebrow-sub">{record.subtitle}</span>
          </div>
          <h1>{translateText(record.title)}</h1>
          <p className="page-description">{t(description)}</p>
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
          <span className="eyebrow">{t('{{type}} profile', { type: t(eyebrow.toLowerCase()) })}</span>
          <h2>{translateText(record.title)}</h2>
          <p>{translateText(record.subtitle)}</p>
        </div>
        <span className="detail-open-label">
          <ArrowUpRight size={14} />
          {t('Marketplace record')}
        </span>
      </section>

      <section className="detail-fields-grid" aria-label={t('{{type}} details', { type: t(eyebrow.toLowerCase()) })}>
        {record.details.map((item, index) => (
          <article className="panel detail-field-card" key={`${item.label}-${index}`}>
            <span>{t(item.label)}</span>
            <strong>{translateText(item.value)}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
