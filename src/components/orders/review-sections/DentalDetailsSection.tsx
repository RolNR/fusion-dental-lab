import { DetailRow, SectionTitle } from './ReviewSectionComponents';
import { getScanTypeLabel } from '@/lib/scanTypeUtils';
import { ScanType } from '@prisma/client';

interface DentalDetailsSectionProps {
  teethNumbers?: string;
  scanType?: ScanType | null;
}

export function DentalDetailsSection({ teethNumbers, scanType }: DentalDetailsSectionProps) {
  return (
    <>
      <SectionTitle>Detalles Dentales</SectionTitle>
      <dl className="space-y-1">
        <DetailRow label="Números de Dientes" value={teethNumbers} />
        <DetailRow
          label="Tipo de Escaneo"
          value={scanType ? getScanTypeLabel(scanType) : undefined}
        />
      </dl>
    </>
  );
}
