import { formatText } from '@/utils/text';
import { Activity, Bell, Check, ChevronDown, CircleHelp, LogOut, Search, Settings2, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  ALL_STATUSES,
  isApplePlatform,
  isSearchShortcut,
  quickFiltersFor,
  sectionSupportsSearch,
} from '@/constants/quickFilters';
import type { AdminSection } from '@/constants/routes';

type TopbarProps = {
  section: AdminSection;
  search: string;
  onSearch: (value: string) => void;
  statusFilter: string;
  onStatusFilter: (status: string) => void;
  onOpenApprovals: () => void;
  onNavigate: (section: AdminSection) => void;
  onSignOut: () => void;
  pendingApprovals: number;
};

const profileMenu: { section: AdminSection; label: string; icon: typeof Settings2 }[] = [
  { section: 'settings', label: 'Settings', icon: Settings2 },
  { section: 'activity-log', label: 'Activity log', icon: Activity },
  { section: 'help', label: 'Help & support', icon: CircleHelp },
];

export function Topbar({
  section,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  onOpenApprovals,
  onNavigate,
  onSignOut,
  pendingApprovals,
}: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [isApple] = useState(isApplePlatform);
  const searchEnabled = sectionSupportsSearch(section);
  const quickFilters = quickFiltersFor(section);
  const filterActive = statusFilter !== ALL_STATUSES;

  useEffect(() => {
    if (!searchEnabled) return;
    const focusSearch = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event, isApple)) return;
      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    document.addEventListener('keydown', focusSearch);
    return () => document.removeEventListener('keydown', focusSearch);
  }, [isApple, searchEnabled]);

  useEffect(() => {
    setFiltersOpen(false);
  }, [section]);

  useEffect(() => {
    if (!filtersOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !filtersRef.current?.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [filtersOpen]);

  const applyFilter = (status: string) => {
    onStatusFilter(status);
    setFiltersOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

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
            ref={searchRef}
            aria-label={'Search current page'}
            aria-keyshortcuts={searchEnabled ? (isApple ? 'Meta+K' : 'Control+K') : undefined}
            disabled={!searchEnabled}
            placeholder={searchEnabled ? 'Search this page...' : 'Search is available on list pages'}
            value={search}
            onChange={event => onSearch(event.target.value)}
          />
          {searchEnabled ? <kbd aria-hidden="true">{isApple ? '⌘ K' : 'Ctrl K'}</kbd> : null}
        </label>
        {quickFilters.length > 0 ? (
          <div className="quick-filter-menu" ref={filtersRef}>
            <button
              className={filterActive ? 'topbar-filter topbar-filter-active' : 'topbar-filter'}
              aria-label={filterActive ? `Quick filters (showing ${statusFilter})` : 'Quick filters'}
              aria-expanded={filtersOpen}
              aria-haspopup="menu"
              onClick={() => setFiltersOpen(open => !open)}
              type="button"
            >
              <SlidersHorizontal size={17} />
              {filterActive ? <i /> : null}
            </button>
            {filtersOpen ? (
              <div className="profile-dropdown" role="menu" aria-label={'Quick filters'}>
                {quickFilters.map(filter => (
                  <button
                    key={filter.status}
                    role="menuitemradio"
                    aria-checked={statusFilter === filter.status}
                    onClick={() => applyFilter(filter.status)}
                    type="button"
                  >
                    {statusFilter === filter.status ? <Check size={15} /> : <span className="quick-filter-spacer" />}
                    {filter.label}
                  </button>
                ))}
                <div className="profile-dropdown-divider" />
                <button
                  role="menuitemradio"
                  aria-checked={!filterActive}
                  onClick={() => applyFilter(ALL_STATUSES)}
                  type="button"
                >
                  {!filterActive ? <Check size={15} /> : <span className="quick-filter-spacer" />}
                  {'All statuses'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <button
          className="notification-button"
          aria-label={formatText('{{count}} pending approvals', { count: pendingApprovals })}
          onClick={onOpenApprovals}
        >
          <Bell size={18} />
          {pendingApprovals > 0 ? <i /> : null}
        </button>
        <div className="topbar-divider" />
        <div className="profile-menu" ref={menuRef}>
          <button
            className="profile-switch"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen(open => !open)}
            type="button"
          >
            <span className="user-avatar admin-avatar">A</span>
            <span className="profile-copy">
              <strong>{'Admin session'}</strong>
              <small>{'Server verified'}</small>
            </span>
            <ChevronDown size={15} className={menuOpen ? 'profile-chevron-open' : undefined} />
          </button>
          {menuOpen ? (
            <div className="profile-dropdown" role="menu">
              {profileMenu.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.section}
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onNavigate(item.section);
                    }}
                    type="button"
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                );
              })}
              <div className="profile-dropdown-divider" />
              <button className="profile-dropdown-danger" role="menuitem" onClick={onSignOut} type="button">
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
