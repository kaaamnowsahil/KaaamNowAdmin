import { useState } from 'react';

import { BookingLedgerTab } from '@/features/marketplace/BookingLedgerTab';
import { PoliciesTab } from '@/features/marketplace/PoliciesTab';
import { PromoCodesTab } from '@/features/marketplace/PromoCodesTab';
import { TermsAcceptancesTab } from '@/features/marketplace/TermsAcceptancesTab';
import { UrgentSupportTab } from '@/features/marketplace/UrgentSupportTab';
import { WorkerRecordsTab } from '@/features/marketplace/WorkerRecordsTab';

type Tab = 'urgent' | 'booking' | 'workers' | 'promos' | 'policies' | 'terms';

const TABS: { id: Tab; label: string }[] = [
  { id: 'urgent', label: 'Urgent support' },
  { id: 'booking', label: 'Booking ledger' },
  { id: 'workers', label: 'Worker dues & strikes' },
  { id: 'promos', label: 'Promo codes' },
  { id: 'policies', label: 'Fees & policies' },
  { id: 'terms', label: 'T&C acceptances' },
];

type MarketplacePageProps = { token: string; onSessionExpired: () => void };

/** Marketplace rules: emergencies, booking money trail and overrides, strikes, promos, policies. */
export function MarketplacePage({ token, onSessionExpired }: MarketplacePageProps) {
  const [tab, setTab] = useState<Tab>('urgent');
  const [booking, setBooking] = useState<{ assignmentId: string; ticketId?: string }>({ assignmentId: '' });
  const props = { token, onSessionExpired };

  return (
    <section className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">MARKETPLACE RULES</p>
          <h1>Marketplace</h1>
          <p>Cancellations, strikes, promo codes, fees and urgent help.</p>
        </div>
      </header>
      <div className="approve-row" role="tablist">
        {TABS.map((item) => (
          <button
            aria-selected={tab === item.id}
            className={tab === item.id ? 'primary-button' : 'secondary-button'}
            key={item.id}
            onClick={() => setTab(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'urgent' && (
        <UrgentSupportTab
          {...props}
          onOpenBooking={(assignmentId, ticketId) => {
            setBooking({ assignmentId, ticketId });
            setTab('booking');
          }}
        />
      )}
      {tab === 'booking' && (
        <BookingLedgerTab
          {...props}
          initialAssignmentId={booking.assignmentId}
          key={booking.assignmentId}
          supportTicketId={booking.ticketId}
        />
      )}
      {tab === 'workers' && <WorkerRecordsTab {...props} />}
      {tab === 'promos' && <PromoCodesTab {...props} />}
      {tab === 'policies' && <PoliciesTab {...props} />}
      {tab === 'terms' && <TermsAcceptancesTab {...props} />}
    </section>
  );
}
