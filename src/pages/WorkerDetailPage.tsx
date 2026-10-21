import type { SelectedRecord } from './ManagementPage';
import { RecordDetailPage } from './RecordDetailPage';

type WorkerDetailPageProps = {
  record: SelectedRecord;
  onBack: () => void;
};

export function WorkerDetailPage({ record, onBack }: WorkerDetailPageProps) {
  return (
    <RecordDetailPage
      record={record}
      eyebrow="WORKER"
      description="Review the worker’s identity, work history, earnings and payout readiness."
      onBack={onBack}
    />
  );
}
