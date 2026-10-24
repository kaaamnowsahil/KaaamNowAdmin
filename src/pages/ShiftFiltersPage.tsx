import { RefreshCw } from 'lucide-react';

import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ShiftFilterGroup } from '@/features/shift-filters/ShiftFilterGroup';
import { useShiftFilterOptions } from '@/features/shift-filters/useShiftFilterOptions';
import type { ShiftFilterType } from '@/api/shiftFilters';

type ShiftFiltersPageProps = {
  token: string;
  onSessionExpired: () => void;
};

const groups: {
  type: ShiftFilterType;
  title: string;
  description: string;
}[] = [
  {
    type: 'distance',
    title: 'Distance',
    description: 'Maximum distance from the worker’s current location, in kilometers.',
  },
  {
    type: 'minimum_pay',
    title: 'Minimum pay',
    description: 'Minimum hourly pay in rupees.',
  },
  {
    type: 'shift_length',
    title: 'Shift length',
    description: 'Shift duration range in hours. Leave the maximum empty for no upper limit.',
  },
];

export function ShiftFiltersPage({ token, onSessionExpired }: ShiftFiltersPageProps) {
  const filters = useShiftFilterOptions({ token, onSessionExpired });

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <div className="eyebrow-row">
            <span className="eyebrow">MARKETPLACE CONFIGURATION</span>
            <span className="title-divider">/</span>
            <span className="eyebrow-sub">Worker discovery</span>
          </div>
          <h1>Shift filters</h1>
          <p className="page-description">
            Manage the options workers can use to filter available shifts.
          </p>
        </div>
        <button
          className="button button-secondary"
          disabled={filters.loading}
          onClick={() => void filters.load()}
          type="button"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </section>

      {filters.error ? <div className="inline-error" role="alert">{filters.error}</div> : null}
      {filters.notice ? <div className="inline-notice" role="status">{filters.notice}</div> : null}

      {filters.loading ? (
        <div className="work-category-loading">
          <LoadingIndicator label="Loading shift filters…" />
        </div>
      ) : (
        groups.map(group => (
          <ShiftFilterGroup
            key={group.type}
            busyId={filters.busyId}
            onCreate={filters.create}
            onDeactivate={filters.remove}
            onRestore={filters.restore}
            onUpdate={filters.update}
            options={filters.options.filter(option => option.filter_type === group.type)}
            saving={filters.saving}
            title={group.title}
            description={group.description}
            type={group.type}
          />
        ))
      )}
    </div>
  );
}
