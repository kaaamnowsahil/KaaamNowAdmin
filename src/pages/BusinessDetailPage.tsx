import type { SelectedRecord } from './ManagementPage';
import { RecordDetailPage } from './RecordDetailPage';

type BusinessDetailPageProps = {
  record: SelectedRecord;
  onBack: () => void;
  onToggleAccountStatus: (userId: string, suspended: boolean) => void;
  accountStatusBusy: boolean;
};

export function BusinessDetailPage({
  record,
  onBack,
  onToggleAccountStatus,
  accountStatusBusy,
}: BusinessDetailPageProps) {
  return (
    <RecordDetailPage
      record={record}
      eyebrow="BUSINESS"
      description="Review the business profile, verification, marketplace activity and outstanding balance."
      onBack={onBack}
      onToggleAccountStatus={onToggleAccountStatus}
      accountStatusBusy={accountStatusBusy}
    />
  );
}
