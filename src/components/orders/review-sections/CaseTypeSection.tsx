import { CaseType } from '@prisma/client';
import { DetailRow, SectionTitle } from './ReviewSectionComponents';

interface CaseTypeSectionProps {
  tipoCaso?: CaseType;
  motivoGarantia?: string;
}

const CASE_TYPE_LABELS: Record<CaseType, string> = {
  nuevo: 'Caso Nuevo',
  garantia: 'Garantía',
  regreso_prueba: 'Regreso de Prueba',
  reparacion_ajuste: 'Reparación o Ajuste',
};

export function CaseTypeSection({ tipoCaso, motivoGarantia }: CaseTypeSectionProps) {
  if (!tipoCaso) return null;

  return (
    <>
      <SectionTitle>Tipo de Caso</SectionTitle>
      <dl className="space-y-1">
        <DetailRow label="Tipo de Caso" value={CASE_TYPE_LABELS[tipoCaso]} />
        {tipoCaso === 'garantia' && (
          <DetailRow label="Motivo de Garantía" value={motivoGarantia} />
        )}
      </dl>
    </>
  );
}
