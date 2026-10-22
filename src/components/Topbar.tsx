import { Bell, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';

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
  const { t, i18n } = useTranslation();
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>{t('Workspace')}</span>
        <span className="breadcrumb-separator">/</span>
        <strong>{t('Operations')}</strong>
      </div>
      <div className="topbar-actions">
        <label className="global-search">
          <Search size={17} />
          <input
            aria-label={t('Search current page')}
            placeholder={t('Search anything...')}
            value={search}
            onChange={event => onSearch(event.target.value)}
          />
          <kbd>⌘ K</kbd>
        </label>
        <button className="topbar-filter" aria-label={t('Quick filters')}>
          <SlidersHorizontal size={17} />
        </button>
        <button
          className="notification-button"
          aria-label={t('{{count}} pending approvals', { count: pendingApprovals })}
          onClick={onOpenApprovals}
        >
          <Bell size={18} />
          {pendingApprovals > 0 ? <i /> : null}
        </button>
        <div className="topbar-divider" />
        <label className="language-switcher" aria-label={t('Language')}>
          <span className="sr-only">{t('Language')}</span>
          <select value={i18n.language} onChange={event => void changeLanguage(event.target.value)}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
        </label>
        <button className="profile-switch">
          <span className="user-avatar admin-avatar">AS</span>
          <span className="profile-copy">
            <strong>{t('Sarah')}</strong>
            <small>{t('Super admin')}</small>
          </span>
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}
