import { DetailRow, SectionTitle } from './ReviewSectionComponents';
import { InitialToothStatesMap, getInitialStatesSummary } from '@/types/initial-tooth-state';

interface DentalDetailsSectionProps {
  teethNumbers?: string;
  isDigitalScan?: boolean;
  initialToothStates?: InitialToothStatesMap;
}

export function DentalDetailsSection({
  teethNumbers,
  isDigitalScan,
  initialToothStates,
}: DentalDetailsSectionProps) {
  const initialStatesSummary = getInitialStatesSummary(initialToothStates);

  return (
    <>
      <SectionTitle>Detalles Dentales</SectionTitle>
      <dl className="space-y-1">
        <DetailRow label="Números de Dientes" value={teethNumbers} />
        {initialStatesSummary && (
          <DetailRow label="Situación Inicial" value={initialStatesSummary} />
        )}
        {isDigitalScan && <DetailRow label="Escaneo Digital" value="Sí" />}
      </dl>
    </>
  );
}
