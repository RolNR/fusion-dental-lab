import { DetailRow, SectionTitle } from './ReviewSectionComponents';

interface SubmissionTypeSectionProps {
  submissionType?: string | null;
  articulatedBy?: 'doctor' | 'laboratorio' | null;
}

function getSubmissionTypeLabel(type: string): string {
  switch (type) {
    case 'prueba':
      return 'Prueba';
    case 'prueba_estructura':
      return 'Prueba de Estructura';
    case 'prueba_estetica':
      return 'Prueba Estética';
    case 'terminado':
      return 'Terminado';
    default:
      return type;
  }
}

export function SubmissionTypeSection({
  submissionType,
  articulatedBy,
}: SubmissionTypeSectionProps) {
  if (!submissionType) return null;

  return (
    <>
      <SectionTitle>Tipo de Entrega</SectionTitle>
      <dl className="space-y-1">
        <DetailRow label="Tipo de Entrega" value={getSubmissionTypeLabel(submissionType)} />
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
