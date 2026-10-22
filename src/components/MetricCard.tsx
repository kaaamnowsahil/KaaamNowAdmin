import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type MetricCardProps = {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: LucideIcon;
  iconTone: string;
  note?: string;
  noteValues?: Record<string, string | number>;
};

export function MetricCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  iconTone,
  note = 'vs. last month',
  noteValues,
}: MetricCardProps) {
  const { t } = useTranslation();
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{t(label)}</span>
        <span className={`metric-icon ${iconTone}`}>
          <Icon size={18} strokeWidth={1.8} />
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
      <div className="metric-foot">
        {change && trend ? (
          <span className={`metric-change ${trend}`}>
            <TrendIcon size={14} />
            {change}
          </span>
        ) : null}
        <span>{t(note, noteValues)}</span>
      </div>
    </article>
  );
}
