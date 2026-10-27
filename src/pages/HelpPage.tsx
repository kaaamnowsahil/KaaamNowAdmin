import { ArrowRight, BadgeCheck, CircleHelp, Mail, ShieldAlert, SlidersHorizontal, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { BRAND } from '@/constants/brand';
import type { AdminSection } from '@/constants/routes';

type HelpPageProps = {
  onOpenSection: (section: AdminSection) => void;
};

const guides: {
  section: AdminSection;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    section: 'approvals',
    title: 'Verify workers and businesses',
    description: 'Review pending profiles and approve or reject them with a note.',
    icon: BadgeCheck,
  },
  {
    section: 'payouts',
    title: 'Process payouts',
    description: 'Track worker withdrawals and move them through paid or failed.',
    icon: Wallet,
  },
  {
    section: 'support',
    title: 'Resolve support tickets',
    description: 'Answer tickets raised by workers and businesses from the app.',
    icon: CircleHelp,
  },
  {
    section: 'shift-filters',
    title: 'Configure shift filters',
    description: 'Change the distance, pay, and length filters workers see.',
    icon: SlidersHorizontal,
  },
  {
    section: 'account-deletion',
    title: 'Handle account deletion',
    description: 'Check blockers and record a decision for each deletion request.',
    icon: ShieldAlert,
  },
];

const faqs = [
  {
    question: 'Why was I signed out?',
    answer: 'Admin sessions expire after a while and are tied to this browser tab. Sign in again to get a new session.',
  },
  {
    question: 'Where can I see who changed a price or coupon?',
    answer: 'Open Activity log. Every change to pricing, coupons, and cancellation rules is recorded with its before and after values.',
  },
  {
    question: 'A change is not showing in the app.',
    answer: 'Use Refresh on the page to confirm it saved, then reopen the app. Deactivated options are hidden from workers and businesses.',
  },
];

export function HelpPage({ onOpenSection }: HelpPageProps) {
  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <div className="eyebrow-row">
            <span className="eyebrow">HELP CENTER</span>
            <span className="title-divider">/</span>
            <span className="eyebrow-sub">Guides and contacts</span>
          </div>
          <h1>Help &amp; support</h1>
          <p className="page-description">Jump to common admin tasks or get in touch with the team.</p>
        </div>
      </section>

      <section className="help-guides">
        {guides.map(guide => {
          const Icon = guide.icon;
          return (
            <button key={guide.section} className="panel help-guide" onClick={() => onOpenSection(guide.section)} type="button">
              <span className="settings-icon"><Icon size={16} /></span>
              <strong>{guide.title}</strong>
              <span>{guide.description}</span>
              <em>Open <ArrowRight size={13} /></em>
            </button>
          );
        })}
      </section>

      <div className="help-columns">
        <section className="panel help-faq">
          <h2>Common questions</h2>
          {faqs.map(faq => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>

        <section className="panel help-contact">
          <h2>Contact the team</h2>
          <p>For bugs, access problems, or anything urgent, email:</p>
          {BRAND.SUPPORT_EMAILS.map(email => (
            <a key={email} href={`mailto:${email}`}>
              <Mail size={14} />
              {email}
            </a>
          ))}
        </section>
      </div>
    </div>
  );
}
