export type ManagementMetric = {
  label: string;
  value: string;
  attention: boolean;
};

type ManagementMetricsProps = {
  metrics: ManagementMetric[];
};

export function ManagementMetrics({ metrics }: ManagementMetricsProps) {
  return (
    <section className="table-metrics" aria-label="Section metrics">
      {metrics.map(metric => (
        <div className="table-metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong className={metric.attention ? 'attention-number' : undefined}>
            {metric.value}
          </strong>
        </div>
      ))}
    </section>
  );
}
