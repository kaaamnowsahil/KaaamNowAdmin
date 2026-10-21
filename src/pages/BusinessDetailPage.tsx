import type { SelectedRecord } from './ManagementPage';
import { RecordDetailPage } from './RecordDetailPage';

type BusinessDetailPageProps = {
  record: SelectedRecord;
  onBack: () => void;
};

export function BusinessDetailPage({ record, onBack }: BusinessDetailPageProps) {
  return (
    <RecordDetailPage
      record={record}
      eyebrow="BUSINESS"
      description="Review the business profile, verification, marketplace activity and outstanding balance."
      onBack={onBack}
    />
  );
}
