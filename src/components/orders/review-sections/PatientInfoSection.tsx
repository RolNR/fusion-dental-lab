import { DetailRow, SectionTitle } from './ReviewSectionComponents';

interface PatientInfoSectionProps {
  patientName?: string;
  patientId?: string;
  fechaEntregaDeseada?: string;
}

export function PatientInfoSection({
  patientName,
  patientId,
  fechaEntregaDeseada,
}: PatientInfoSectionProps) {
  return (
    <>
      <SectionTitle>Información del Paciente</SectionTitle>
      <dl className="space-y-1">
        <DetailRow label="Nombre del Paciente" value={patientName} />
        <DetailRow label="ID del Paciente" value={patientId} />
        <DetailRow
          label="Fecha de Entrega Deseada"
          value={
            fechaEntregaDeseada
              ? new Date(fechaEntregaDeseada).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : undefined
          }
        />
      </dl>
    </>
  );
}
