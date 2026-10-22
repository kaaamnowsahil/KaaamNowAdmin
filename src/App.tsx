import {
  Check,
  ChevronRight,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Sidebar, type Section } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { OverviewPage } from '@/pages/OverviewPage';
import {
  ManagementPage,
  type AdminSection,
  type SelectedRecord,
} from '@/pages/ManagementPage';
import { PayoutsPage } from '@/pages/PayoutsPage';
import { BusinessDetailPage } from '@/pages/BusinessDetailPage';
import { RecordDetailPage } from '@/pages/RecordDetailPage';
import { SupportPage } from '@/pages/SupportPage';
import { WorkerDetailPage } from '@/pages/WorkerDetailPage';
import {
  approvals as initialApprovals,
  businesses as initialBusinesses,
  payments as initialPayments,
  payouts as initialPayouts,
  shifts as initialShifts,
  supportTickets as initialSupportTickets,
  workers as initialWorkers,
} from '@/data/mockData';
import type { PayoutStatus } from '@/types';

const pageTitles: Record<Section, string> = {
  overview: 'Overview',
  workers: 'Workers',
  businesses: 'Businesses',
  shifts: 'Shifts',
  payments: 'Payments',
  payouts: 'Payouts',
  approvals: 'Approvals',
  support: 'Support',
};

function App() {
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [workers, setWorkers] = useState(initialWorkers);
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [paymentRows] = useState(initialPayments);
  const [payoutRows, setPayoutRows] = useState(initialPayouts);
  const [supportTickets, setSupportTickets] = useState(initialSupportTickets);
  const [approvalRows, setApprovalRows] = useState(initialApprovals);
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(
    null,
  );
  const [toast, setToast] = useState('');

  const pendingApprovals = useMemo(
    () => approvalRows.filter(approval => approval.status === 'pending').length,
    [approvalRows],
  );

  const navigate = (nextSection: Section) => {
    setSection(nextSection);
    setSearch('');
    setSelectedRecord(null);
  };

  const reviewApproval = (
    id: string,
    action: 'approved' | 'rejected',
  ) => {
    const request = approvalRows.find(item => item.id === id);
    if (!request || request.status !== 'pending') return;

    setApprovalRows(current =>
      current.map(item =>
        item.id === id
          ? { ...item, status: action, reviewedAt: new Date().toISOString() }
          : item,
      ),
    );

    if (request.subject === 'worker') {
      setWorkers(current =>
        current.map(worker =>
          worker.id === request.subjectId
            ? {
                ...worker,
                status: action === 'approved' ? 'active' : 'blocked',
                kycStatus: action === 'approved' ? 'verified' : 'rejected',
              }
            : worker,
        ),
      );
    } else {
      setBusinesses(current =>
        current.map(business =>
          business.id === request.subjectId
            ? {
                ...business,
                status: action === 'approved' ? 'active' : 'blocked',
                isVerified: action === 'approved',
              }
            : business,
        ),
      );
    }

    setToast(t(action === 'approved' ? 'Approval accepted for {{name}}.' : 'Approval rejected for {{name}}.', { name: request.name }));
    window.setTimeout(() => setToast(''), 3200);
  };

  const updatePayout = (id: string, status: PayoutStatus) => {
    const payout = payoutRows.find(item => item.id === id);
    if (!payout) return;

    const allowedNextStatus: Partial<Record<PayoutStatus, PayoutStatus>> = {
      pending: 'processing',
      processing: 'completed',
    };
    if (allowedNextStatus[payout.status] !== status) return;

    setPayoutRows(current =>
      current.map(item =>
        item.id === id
          ? {
              ...item,
              status,
              processedAt:
                status === 'completed' ? new Date().toISOString() : item.processedAt,
            }
          : item,
      ),
    );
    const localizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    setToast(t('Payout {{reference}} marked {{status}}.', { reference: payout.reference, status: t(localizedStatus) }));
    window.setTimeout(() => setToast(''), 3200);
  };

  const resolveTicket = (ticketId: string) => {
    const ticket = supportTickets.find(item => item.id === ticketId);
    if (!ticket || ticket.status === 'resolved') return;
    setSupportTickets(current =>
      current.map(item =>
        item.id === ticketId
          ? { ...item, status: 'resolved', updatedAt: new Date().toISOString() }
          : item,
      ),
    );
    setToast(t('Support ticket resolved.'));
    window.setTimeout(() => setToast(''), 3200);
  };

  return (
    <div className="admin-app">
      <Sidebar
        active={section}
        pendingApprovals={pendingApprovals}
        mobileOpen={mobileSidebarOpen}
        onNavigate={navigate}
        onClose={() => setMobileSidebarOpen(false)}
        onToggle={() => setMobileSidebarOpen(open => !open)}
      />
      <main className="main-shell">
        <Topbar
          search={search}
          onSearch={setSearch}
          pendingApprovals={pendingApprovals}
          onOpenApprovals={() => navigate('approvals')}
        />
        <div className="main-content">
          <div className="mobile-page-label">
            <span>{t(pageTitles[section])}</span>
            <ChevronRight size={14} />
            <span>{t('Operations')}</span>
          </div>
          {selectedRecord ? (
            selectedRecord.type === 'worker' ? (
              <WorkerDetailPage
                record={selectedRecord}
                onBack={() => setSelectedRecord(null)}
              />
            ) : selectedRecord.type === 'business' ? (
              <BusinessDetailPage
                record={selectedRecord}
                onBack={() => setSelectedRecord(null)}
              />
            ) : (
              <RecordDetailPage
                record={selectedRecord}
                eyebrow={t(pageTitles[section]).toUpperCase()}
                description={t('Review the operational details for this marketplace record.')}
                onBack={() => setSelectedRecord(null)}
              />
            )
          ) : section === 'overview' ? (
            <OverviewPage
              workers={workers}
              businesses={businesses}
              shifts={initialShifts}
              payments={paymentRows}
              payouts={payoutRows}
              supportTickets={supportTickets}
              pendingApprovals={pendingApprovals}
              onOpenSection={navigate}
            />
          ) : section === 'payouts' ? (
            <PayoutsPage
              workers={workers}
              businesses={businesses}
              payments={paymentRows}
              payouts={payoutRows}
              approvals={approvalRows}
              search={search}
              onSearch={setSearch}
              onSelect={setSelectedRecord}
              onReviewApproval={reviewApproval}
              onUpdatePayout={updatePayout}
            />
          ) : section === 'support' ? (
            <SupportPage
              workers={workers}
              businesses={businesses}
              payments={paymentRows}
              payouts={payoutRows}
              supportTickets={supportTickets}
              approvals={approvalRows}
              search={search}
              onSearch={setSearch}
              onSelect={setSelectedRecord}
              onReviewApproval={reviewApproval}
              onResolveTicket={resolveTicket}
            />
          ) : (
            <ManagementPage
              section={section as AdminSection}
              workers={workers}
              businesses={businesses}
              shifts={initialShifts}
              payments={paymentRows}
              payouts={payoutRows}
              supportTickets={supportTickets}
              approvals={approvalRows}
              search={search}
              onSearch={setSearch}
              onSelect={setSelectedRecord}
              onReviewApproval={reviewApproval}
              onUpdatePayout={updatePayout}
              onResolveTicket={resolveTicket}
            />
          )}
        </div>
      </main>

      {toast ? (
        <div className="toast-message" role="status">
          <span><Check size={16} /></span>
          {toast}
          <button aria-label={t('Dismiss message')} onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default App;
