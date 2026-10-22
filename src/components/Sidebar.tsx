import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { BRAND } from '@/constants/brand';
import { useTranslation } from 'react-i18next';

export type Section =
  | 'overview'
  | 'workers'
  | 'businesses'
  | 'shifts'
  | 'payments'
  | 'payouts'
  | 'approvals'
  | 'support';

type SidebarProps = {
  active: Section;
  pendingApprovals: number;
  mobileOpen: boolean;
  onNavigate: (section: Section) => void;
  onClose: () => void;
  onToggle: () => void;
};

const navigation: {
  id: Section;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'workers', label: 'Workers', icon: UsersRound },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'shifts', label: 'Shifts', icon: BriefcaseBusiness },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'approvals', label: 'Approvals', icon: BadgeCheck, badge: true },
  { id: 'support', label: 'Support', icon: CircleHelp },
];

export function Sidebar({
  active,
  pendingApprovals,
  mobileOpen,
  onNavigate,
  onClose,
  onToggle,
}: SidebarProps) {
  const { t } = useTranslation();
  return (
    <>
      <button
        className="mobile-menu-trigger"
        aria-label={mobileOpen ? t('Close navigation') : t('Open navigation')}
        onClick={onToggle}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen ? (
        <button
          className="sidebar-backdrop"
          aria-label={t('Close navigation')}
          onClick={onClose}
        />
      ) : null}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span>K</span>
          </div>
          <div className="brand-copy">
            <strong>{BRAND.NAME}</strong>
            <span>{t('ADMIN CONSOLE')}</span>
          </div>
          <button className="sidebar-collapse" aria-label={t('Collapse sidebar')}>
            <ChevronDown size={15} />
          </button>
        </div>

        <div className="workspace-switcher">
          <span className="workspace-avatar">K</span>
          <span className="workspace-copy">
            <strong>KaaamNow</strong>
            <small>{t('Operations workspace')}</small>
          </span>
          <ChevronDown size={15} />
        </div>

        <nav className="primary-nav" aria-label={t('Main navigation')}>
          <p className="nav-label">{t('WORKSPACE')}</p>
          {navigation.slice(0, 5).map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={active === item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
            />
          ))}

          <p className="nav-label nav-label-spaced">{t('MANAGEMENT')}</p>
          {navigation.slice(5).map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={active === item.id}
              badge={pendingApprovals}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
            />
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="sidebar-link">
            <Activity size={17} />
            <span>{t('Activity log')}</span>
          </button>
          <button className="sidebar-link">
            <Settings2 size={17} />
            <span>{t('Settings')}</span>
          </button>
          <button className="sidebar-link">
            <CircleHelp size={17} />
            <span>{t('Help & support')}</span>
          </button>
          <div className="sidebar-user">
            <div className="user-avatar admin-avatar">AS</div>
            <div className="user-copy">
              <strong>{t('Admin Sarah')}</strong>
              <small>{t('Super admin')}</small>
            </div>
            <LogOut size={16} />
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  item,
  active,
  badge,
  onClick,
}: {
  item: (typeof navigation)[number];
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const Icon = item.icon;
  return (
    <button
      className={`nav-item ${active ? 'nav-item-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      <Icon size={18} strokeWidth={active ? 2.1 : 1.8} />
      <span>{t(item.label)}</span>
      {item.badge && badge ? <b className="nav-badge">{badge}</b> : null}
    </button>
  );
}
