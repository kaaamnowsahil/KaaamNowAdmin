import { useState } from 'react';

import { BookingLedgerTab } from '@/features/marketplace/BookingLedgerTab';
import { LiveBookingsTab } from '@/features/marketplace/LiveBookingsTab';
import { LivePricingTab } from '@/features/marketplace/LivePricingTab';
import { PoliciesTab } from '@/features/marketplace/PoliciesTab';
import { PromoCodesTab } from '@/features/marketplace/PromoCodesTab';
import { SearchRadiusTab } from '@/features/marketplace/SearchRadiusTab';
import { ShiftPricingTab } from '@/features/marketplace/ShiftPricingTab';
import { TermsAcceptancesTab } from '@/features/marketplace/TermsAcceptancesTab';
import { UrgentSupportTab } from '@/features/marketplace/UrgentSupportTab';
import { WorkerRecordsTab } from '@/features/marketplace/WorkerRecordsTab';

type Tab =
  | 'urgent'
  | 'booking'
  | 'workers'
  | 'shift-pricing'
  | 'shift-coupons'
  | 'promos'
  | 'policies'
  | 'live-pricing'
  | 'live-bookings'
  | 'search-radius'
  | 'terms';

const TABS: { id: Tab; label: string }[] = [
  { id: 'urgent', label: 'Urgent support' },
  { id: 'booking', label: 'Booking ledger' },
  { id: 'workers', label: 'Worker dues & strikes' },
  { id: 'shift-pricing', label: 'Shift pricing & charges' },
  { id: 'shift-coupons', label: 'Shift coupons' },
  { id: 'promos', label: 'All promo codes' },
  { id: 'policies', label: 'Cancellation & strikes' },
  { id: 'live-pricing', label: 'Live Work pricing & charges' },
  { id: 'live-bookings', label: 'Live Work bookings' },
  { id: 'search-radius', label: 'Search radius' },
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
          <p>Shift and Live Work pricing, coupons, cancellations, strikes and urgent help.</p>
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
      {tab === 'shift-pricing' && <ShiftPricingTab {...props} />}
      {tab === 'shift-coupons' && <PromoCodesTab {...props} key="shift" scope="shift" />}
      {tab === 'promos' && <PromoCodesTab {...props} key="all" />}
      {tab === 'policies' && <PoliciesTab {...props} />}
      {tab === 'live-pricing' && <LivePricingTab {...props} />}
      {tab === 'live-bookings' && <LiveBookingsTab {...props} />}
      {tab === 'search-radius' && <SearchRadiusTab {...props} />}
      {tab === 'terms' && <TermsAcceptancesTab {...props} />}
    </section>
  );
}
