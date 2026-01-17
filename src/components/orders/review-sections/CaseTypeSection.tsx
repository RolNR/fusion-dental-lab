import { DetailRow, SectionTitle } from './ReviewSectionComponents';

interface CaseTypeSectionProps {
  tipoCaso?: 'nuevo' | 'garantia';
  motivoGarantia?: string;
  seDevuelveTrabajoOriginal?: boolean;
}

export function CaseTypeSection({
  tipoCaso,
  motivoGarantia,
  seDevuelveTrabajoOriginal,
}: CaseTypeSectionProps) {
  if (!tipoCaso) return null;

  return (
    <>
      <SectionTitle>Tipo de Caso</SectionTitle>
      <dl className="space-y-1">
        <DetailRow label="Tipo de Caso" value={tipoCaso === 'nuevo' ? 'Nuevo' : 'Garantía'} />
        {tipoCaso === 'garantia' && (
          <>
            <DetailRow label="Motivo de Garantía" value={motivoGarantia} />
            <DetailRow
              label="Se Devuelve Trabajo Original"
              value={seDevuelveTrabajoOriginal ? 'Sí' : 'No'}
            />
          </>
        )}
      </dl>
    </>
  );
}
