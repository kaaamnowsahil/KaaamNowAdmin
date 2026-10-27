import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  Boxes,
  Building2,
  ChevronDown,
  CircleHelp,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Scale,
  Settings2,
  SlidersHorizontal,
  ShieldAlert,
  UsersRound,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { BRAND } from '@/constants/brand';
import type { AdminSection } from '@/constants/routes';

type SidebarProps = {
  active: AdminSection;
  pendingApprovals: number;
  onNavigate: (section: AdminSection) => void;
  onSignOut: () => void;
};

const navigation: {
  id: AdminSection;
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
  { id: 'work-categories', label: 'Work categories', icon: ListChecks },
  { id: 'business-types', label: 'Business / work types', icon: Boxes },
  { id: 'shift-filters', label: 'Shift filters', icon: SlidersHorizontal },
  { id: 'content', label: 'Terms & Conditions / FAQ', icon: FileText },
  { id: 'marketplace', label: 'Marketplace rules', icon: Scale },
  { id: 'account-deletion', label: 'Account deletion', icon: ShieldAlert },
];

const secondaryNavigation: { id: AdminSection; label: string; icon: LucideIcon }[] = [
  { id: 'activity-log', label: 'Activity log', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'help', label: 'Help & support', icon: CircleHelp },
];

export function Sidebar({
  active,
  pendingApprovals,
  onNavigate,
  onSignOut,
}: SidebarProps) {
  return (
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span>K</span>
          </div>
          <div className="brand-copy">
            <strong>{BRAND.NAME}</strong>
            <span>{'ADMIN CONSOLE'}</span>
          </div>
          <button className="sidebar-collapse" aria-label={'Collapse sidebar'}>
            <ChevronDown size={15} />
          </button>
        </div>

        <nav className="primary-nav" aria-label={'Main navigation'}>
          <p className="nav-label">{'WORKSPACE'}</p>
          {navigation.slice(0, 5).map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={active === item.id}
              onClick={() => {
                onNavigate(item.id);
              }}
            />
          ))}

          <p className="nav-label nav-label-spaced">{'MANAGEMENT'}</p>
          {navigation.slice(5).map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={active === item.id}
              badge={pendingApprovals}
              onClick={() => {
                onNavigate(item.id);
              }}
            />
          ))}
        </nav>

        <div className="sidebar-bottom">
          {secondaryNavigation.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button className="sidebar-user sidebar-signout" onClick={onSignOut}>
            <div className="user-avatar admin-avatar">A</div>
            <div className="user-copy">
              <strong>{'Admin session'}</strong>
              <small>{'Server verified'}</small>
            </div>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
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
  const Icon = item.icon;
  return (
    <button
      className={`nav-item ${active ? 'nav-item-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      <Icon size={18} strokeWidth={active ? 2.1 : 1.8} />
      <span>{item.label}</span>
      {item.badge && badge ? <b className="nav-badge">{badge}</b> : null}
    </button>
  );
}
