import { FaqManager } from '@/features/content/FaqManager';
import { TermsManager } from '@/features/content/TermsManager';

type ContentPageProps = {
  token: string;
  onSessionExpired: () => void;
};

export function ContentPage({ token, onSessionExpired }: ContentPageProps) {
  return (
    <div className="page-stack">
      <TermsManager onSessionExpired={onSessionExpired} token={token} />
      <FaqManager onSessionExpired={onSessionExpired} token={token} />
    </div>
  );
}
