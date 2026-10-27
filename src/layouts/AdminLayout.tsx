import { Check, X } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { AppLoader } from '@/components/AppLoader';
import { ROUTE_SECTIONS, ROUTES, SECTION_ROUTES } from '@/constants/routes';
import type { AdminSection } from '@/constants/routes';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { AccountDeletionPage } from '@/pages/AccountDeletionPage';
import { BusinessDetailPage } from '@/pages/BusinessDetailPage';
import { ManagementPage } from '@/pages/ManagementPage';
import type { AdminSection as ManagementSection } from '@/pages/ManagementPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { PayoutsPage } from '@/pages/PayoutsPage';
import { RecordDetailPage } from '@/pages/RecordDetailPage';
import { SupportPage } from '@/pages/SupportPage';
import { WorkerDetailPage } from '@/pages/WorkerDetailPage';
import { LookupManagementPage } from '@/pages/LookupManagementPage';
import { ShiftFiltersPage } from '@/pages/ShiftFiltersPage';
import { ContentPage } from '@/pages/ContentPage';
import { MarketplacePage } from '@/pages/MarketplacePage';
import { ActivityLogPage } from '@/pages/ActivityLogPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { HelpPage } from '@/pages/HelpPage';

const pageTitles: Record<AdminSection, string> = {
  overview: 'Overview',
  workers: 'Workers',
  businesses: 'Businesses',
  shifts: 'Shifts',
  payments: 'Payments',
  payouts: 'Payouts',
  approvals: 'Approvals',
  support: 'Support',
  'work-categories': 'Work categories',
  'business-types': 'Business / work types',
  'shift-filters': 'Shift filters',
  content: 'Terms & Conditions / FAQ',
  marketplace: 'Marketplace rules',
  'account-deletion': 'Account deletion',
  'activity-log': 'Activity log',
  settings: 'Settings',
  help: 'Help & support',
};

type AdminLayoutProps = {
  accessToken: string;
  onSignOut: () => void;
};

export function AdminLayout({ accessToken, onSignOut }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const section = ROUTE_SECTIONS[pathname];
  const dashboard = useAdminDashboard(accessToken, onSignOut);

  if (!section) return <Navigate to={ROUTES.dashboard} replace />;

  const navigateToSection = (nextSection: AdminSection) => {
    dashboard.resetSelection();
    navigate(SECTION_ROUTES[nextSection]);
  };

  return (
    <div className="admin-app">
      <Sidebar
        active={section}
        pendingApprovals={dashboard.pendingApprovals}
        onNavigate={navigateToSection}
        onSignOut={onSignOut}
      />
      <main className="main-shell">
        <Topbar
          section={section}
          search={dashboard.search}
          onSearch={dashboard.setSearch}
          statusFilter={dashboard.statusFilter}
          onStatusFilter={dashboard.setStatusFilter}
          pendingApprovals={dashboard.pendingApprovals}
          onOpenApprovals={() => navigateToSection('approvals')}
          onNavigate={navigateToSection}
          onSignOut={onSignOut}
        />
        <div className="main-content">
          {section === 'overview' && (dashboard.workersError || dashboard.businessesError) ? (
            <div className="inline-error" role="alert">
              {dashboard.workersError || dashboard.businessesError}{' '}
              <button className="text-action" onClick={() => void dashboard.reloadDirectory()}>
                Retry
              </button>
            </div>
          ) : null}
          {section === 'workers' && dashboard.workersError ? (
            <div className="inline-error" role="alert">
              {dashboard.workersError}{' '}
              <button className="text-action" onClick={() => void dashboard.reloadWorkers()}>
                Retry
              </button>
            </div>
          ) : null}
          {section === 'businesses' && dashboard.businessesError ? (
            <div className="inline-error" role="alert">
              {dashboard.businessesError}{' '}
              <button className="text-action" onClick={() => void dashboard.reloadBusinesses()}>
                Retry
              </button>
            </div>
          ) : null}
          {(section === 'overview' || section === 'shifts' || section === 'payments' || section === 'payouts' || section === 'support') && dashboard.recordsError ? (
            <div className="inline-error" role="alert">
              {dashboard.recordsError}{' '}
              <button className="text-action" onClick={() => void dashboard.reloadRecords()}>
                Retry
              </button>
            </div>
          ) : null}
          {section === 'support' && dashboard.ticketError ? (
            <div className="inline-error" role="alert">{dashboard.ticketError}</div>
          ) : null}
          {(section === 'overview' || section === 'workers' || section === 'businesses' || section === 'approvals') && dashboard.directoryActionError ? (
            <div className="inline-error" role="alert">{dashboard.directoryActionError}</div>
          ) : null}
          {dashboard.selectedRecord ? (
            dashboard.selectedRecord.type === 'worker' ? (
              <WorkerDetailPage
                record={dashboard.selectedRecord}
                onBack={() => dashboard.setSelectedRecord(null)}
                onToggleAccountStatus={dashboard.setUserSuspended}
                accountStatusBusy={dashboard.busyDirectoryId === dashboard.selectedRecord.userId}
              />
            ) : dashboard.selectedRecord.type === 'business' ? (
              <BusinessDetailPage
                record={dashboard.selectedRecord}
                onBack={() => dashboard.setSelectedRecord(null)}
                onToggleAccountStatus={dashboard.setUserSuspended}
                accountStatusBusy={dashboard.busyDirectoryId === dashboard.selectedRecord.userId}
              />
            ) : (
              <RecordDetailPage
                record={dashboard.selectedRecord}
                eyebrow={pageTitles[section].toUpperCase()}
                description={'Review the operational details for this marketplace record.'}
                onBack={() => dashboard.setSelectedRecord(null)}
              />
            )
          ) : section === 'overview' ? (
            <OverviewPage
              workers={dashboard.workers}
              shifts={dashboard.shifts}
              payments={dashboard.paymentRows}
              payouts={dashboard.payoutRows}
              supportTickets={dashboard.supportTickets}
              pendingApprovals={dashboard.pendingApprovals}
              metrics={dashboard.metrics}
              metricsError={dashboard.metricsError}
              onRetryMetrics={() => void dashboard.reloadRecords()}
              onOpenSection={navigateToSection}
            />
          ) : section === 'payouts' ? (
            <PayoutsPage
              businesses={dashboard.businesses}
              payments={dashboard.paymentRows}
              payouts={dashboard.payoutRows}
              approvals={dashboard.approvalRows}
              search={dashboard.search}
              onSearch={dashboard.setSearch}
              statusFilter={dashboard.statusFilter}
              onStatusFilterChange={dashboard.setStatusFilter}
              onSelect={dashboard.setSelectedRecord}
              serverTotal={dashboard.recordTotals?.withdrawals}
            />
          ) : section === 'account-deletion' ? (
            <AccountDeletionPage token={accessToken} onSessionExpired={onSignOut} />
          ) : section === 'work-categories' ? (
            <LookupManagementPage
              token={accessToken}
              collection="work-categories"
              onSessionExpired={onSignOut}
            />
          ) : section === 'business-types' ? (
            <LookupManagementPage
              token={accessToken}
              collection="business-types"
              onSessionExpired={onSignOut}
            />
          ) : section === 'shift-filters' ? (
            <ShiftFiltersPage token={accessToken} onSessionExpired={onSignOut} />
          ) : section === 'content' ? (
            <ContentPage token={accessToken} onSessionExpired={onSignOut} />
          ) : section === 'marketplace' ? (
            <MarketplacePage token={accessToken} onSessionExpired={onSignOut} />
          ) : section === 'activity-log' ? (
            <ActivityLogPage token={accessToken} onSessionExpired={onSignOut} />
          ) : section === 'settings' ? (
            <SettingsPage accessToken={accessToken} onSignOut={onSignOut} />
          ) : section === 'help' ? (
            <HelpPage onOpenSection={navigateToSection} />
          ) : section === 'support' ? (
            <SupportPage
              businesses={dashboard.businesses}
              payments={dashboard.paymentRows}
              payouts={dashboard.payoutRows}
              supportTickets={dashboard.supportTickets}
              approvals={dashboard.approvalRows}
              search={dashboard.search}
              onSearch={dashboard.setSearch}
              statusFilter={dashboard.statusFilter}
              onStatusFilterChange={dashboard.setStatusFilter}
              onSelect={dashboard.setSelectedRecord}
              onResolveTicket={ticketId => void dashboard.resolveTicket(ticketId)}
              busyTicketId={dashboard.busyTicketId}
              serverTotal={dashboard.recordTotals?.supportTickets}
            />
          ) : (
            <ManagementPage
              section={section as ManagementSection}
              workers={dashboard.workers}
              businesses={dashboard.businesses}
              shifts={dashboard.shifts}
              payments={dashboard.paymentRows}
              payouts={dashboard.payoutRows}
              supportTickets={dashboard.supportTickets}
              approvals={dashboard.approvalRows}
              search={dashboard.search}
              onSearch={dashboard.setSearch}
              statusFilter={dashboard.statusFilter}
              onStatusFilterChange={dashboard.setStatusFilter}
              onSelect={dashboard.setSelectedRecord}
              serverTotal={
                section === 'shifts'
                  ? dashboard.recordTotals?.shifts
                  : section === 'payments'
                    ? dashboard.recordTotals?.payments
                    : undefined
              }
              busyDirectoryId={dashboard.busyDirectoryId}
              busyVerificationDecision={dashboard.busyVerificationDecision}
              onVerifyProfile={dashboard.verifyProfile}
            />
          )}
        </div>
      </main>

      {dashboard.directoryLoading || dashboard.recordsLoading ? (
        <AppLoader label={dashboard.directoryLoading ? 'Loading marketplace profiles…' : 'Loading marketplace records…'} />
      ) : null}

      {dashboard.toast ? (
        <div className="toast-message" role="status">
          <span><Check size={16} /></span>
          {dashboard.toast}
          <button aria-label={'Dismiss message'} onClick={() => dashboard.setToast('')}>
            <X size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
