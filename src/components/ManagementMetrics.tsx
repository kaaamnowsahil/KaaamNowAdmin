import { useTranslation } from 'react-i18next';

export type ManagementMetric = {
  label: string;
  value: string;
  attention: boolean;
};

type ManagementMetricsProps = {
  metrics: ManagementMetric[];
};

export function ManagementMetrics({ metrics }: ManagementMetricsProps) {
  const { t } = useTranslation();
  return (
    <section className="table-metrics" aria-label={t('Section metrics')}>
      {metrics.map(metric => (
        <div className="table-metric" key={metric.label}>
          <span>{t(metric.label)}</span>
          <strong className={metric.attention ? 'attention-number' : undefined}>
            {metric.value}
          </strong>
        </div>
      ))}
    </section>
  );
}
