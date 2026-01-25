import { DetailRow, SectionTitle } from './ReviewSectionComponents';

interface DentalDetailsSectionProps {
  teethNumbers?: string;
  isDigitalScan?: boolean;
}

export function DentalDetailsSection({ teethNumbers, isDigitalScan }: DentalDetailsSectionProps) {
  return (
    <>
      <SectionTitle>Detalles Dentales</SectionTitle>
      <dl className="space-y-1">
        <DetailRow label="Números de Dientes" value={teethNumbers} />
        {isDigitalScan && <DetailRow label="Escaneo Digital" value="Sí" />}
      </dl>
    </>
  );
}
