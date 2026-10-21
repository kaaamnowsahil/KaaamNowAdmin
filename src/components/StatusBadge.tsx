import type { ReactNode } from 'react';

type StatusBadgeProps = {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'blue';
};

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}
