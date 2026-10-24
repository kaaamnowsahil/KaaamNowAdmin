import { formatText } from '@/utils/text';
import { Bell, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';

type TopbarProps = {
  search: string;
  onSearch: (value: string) => void;
  onOpenApprovals: () => void;
  pendingApprovals: number;
};

export function Topbar({
  search,
  onSearch,
  onOpenApprovals,
  pendingApprovals,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>{'Workspace'}</span>
        <span className="breadcrumb-separator">/</span>
        <strong>{'Operations'}</strong>
      </div>
      <div className="topbar-actions">
        <label className="global-search">
          <Search size={17} />
          <input
            aria-label={'Search current page'}
            placeholder={'Search anything...'}
            value={search}
            onChange={event => onSearch(event.target.value)}
          />
          <kbd>⌘ K</kbd>
        </label>
        <button className="topbar-filter" aria-label={'Quick filters'}>
          <SlidersHorizontal size={17} />
        </button>
        <button
          className="notification-button"
          aria-label={formatText('{{count}} pending approvals', { count: pendingApprovals })}
          onClick={onOpenApprovals}
        >
          <Bell size={18} />
          {pendingApprovals > 0 ? <i /> : null}
        </button>
        <div className="topbar-divider" />
        <button className="profile-switch">
          <span className="user-avatar admin-avatar">A</span>
          <span className="profile-copy">
            <strong>{'Admin session'}</strong>
            <small>{'Server verified'}</small>
          </span>
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}
