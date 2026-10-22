import type { ReactNode } from 'react';
import { translateText } from '@/i18n';

type StatusBadgeProps = {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'blue';
};

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={`status-badge status-${tone}`}>{typeof children === 'string' ? translateText(children) : children}</span>;
}
