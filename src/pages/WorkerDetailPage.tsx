import { WorkerHoldPanel } from '@/features/marketplace/WorkerHoldPanel';

import type { SelectedRecord } from './ManagementPage';
import { RecordDetailPage } from './RecordDetailPage';

type WorkerDetailPageProps = {
  record: SelectedRecord;
  onBack: () => void;
  onToggleAccountStatus: (userId: string, suspended: boolean) => void;
  accountStatusBusy: boolean;
  token: string;
  onSessionExpired: () => void;
};

export function WorkerDetailPage({
  record,
  onBack,
  onToggleAccountStatus,
  accountStatusBusy,
  token,
  onSessionExpired,
}: WorkerDetailPageProps) {
  return (
    <div className="page-stack">
    <RecordDetailPage
      record={record}
      eyebrow="WORKER"
      description="Review the worker’s profile, verification status, work categories and activity."
      onBack={onBack}
      onToggleAccountStatus={onToggleAccountStatus}
      accountStatusBusy={accountStatusBusy}
    />
    {record.userId ? (
      <WorkerHoldPanel token={token} onSessionExpired={onSessionExpired} userId={record.userId} />
    ) : null}
    </div>
  );
}
