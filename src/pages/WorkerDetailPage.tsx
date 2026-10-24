import type { SelectedRecord } from './ManagementPage';
import { RecordDetailPage } from './RecordDetailPage';

type WorkerDetailPageProps = {
  record: SelectedRecord;
  onBack: () => void;
  onToggleAccountStatus: (userId: string, suspended: boolean) => void;
  accountStatusBusy: boolean;
};

export function WorkerDetailPage({
  record,
  onBack,
  onToggleAccountStatus,
  accountStatusBusy,
}: WorkerDetailPageProps) {
  return (
    <RecordDetailPage
      record={record}
      eyebrow="WORKER"
      description="Review the worker’s profile, verification status, work categories and activity."
      onBack={onBack}
      onToggleAccountStatus={onToggleAccountStatus}
      accountStatusBusy={accountStatusBusy}
    />
  );
}
