import { DetailRow, SectionTitle } from './ReviewSectionComponents';

interface SubmissionTypeSectionProps {
  submissionType?: string | null;
  articulatedBy?: 'doctor' | 'laboratorio' | null;
}

export function SubmissionTypeSection({
  submissionType,
  articulatedBy,
}: SubmissionTypeSectionProps) {
  if (!submissionType) return null;

  return (
    <>
      <SectionTitle>Tipo de Envío</SectionTitle>
      <dl className="space-y-1">
        <DetailRow label="Tipo de Envío" value={submissionType} />
        {articulatedBy && (
          <DetailRow
            label="Articulado Por"
            value={articulatedBy === 'doctor' ? 'Doctor' : 'Laboratorio'}
          />
        )}
      </dl>
    </>
  );
}
