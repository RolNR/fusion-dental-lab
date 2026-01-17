import { DetailRow, SectionTitle } from './ReviewSectionComponents';

interface DescriptionNotesSectionProps {
  description?: string;
  notes?: string;
}

export function DescriptionNotesSection({ description, notes }: DescriptionNotesSectionProps) {
  if (!description && !notes) return null;

  return (
    <>
      <SectionTitle>Descripción y Notas</SectionTitle>
      <dl className="space-y-1">
        <DetailRow label="Descripción" value={description} />
        <DetailRow label="Notas Adicionales" value={notes} />
      </dl>
    </>
  );
}
