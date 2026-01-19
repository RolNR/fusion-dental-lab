import { DetailRow, SectionTitle } from './ReviewSectionComponents';
import { Input } from '@/components/ui/Input';

interface PatientInfoSectionProps {
  patientName?: string;
  patientId?: string;
  fechaEntregaDeseada?: string;
  // Optional edit handlers - if provided, fields become editable
  onPatientNameChange?: (value: string) => void;
  onFechaEntregaChange?: (value: string) => void;
  // Validation errors
  errors?: {
    patientName?: string;
    fechaEntregaDeseada?: string;
  };
}

export function PatientInfoSection({
  patientName,
  patientId,
  fechaEntregaDeseada,
  onPatientNameChange,
  onFechaEntregaChange,
  errors,
}: PatientInfoSectionProps) {
  const isEditable = !!(onPatientNameChange || onFechaEntregaChange);

  return (
    <>
      <SectionTitle>Información del Paciente</SectionTitle>
      <dl className="space-y-3">
        {/* Patient Name - Editable if handler provided */}
        {onPatientNameChange ? (
          <div>
            <Input
              label="Nombre del Paciente"
              required
              value={patientName || ''}
              onChange={(e) => onPatientNameChange(e.target.value)}
              error={errors?.patientName}
              placeholder="Ingresa el nombre del paciente"
            />
          </div>
        ) : (
          <DetailRow
            label="Nombre del Paciente"
            value={patientName}
            required={isEditable}
          />
        )}

        {/* Patient ID - Read-only display only (not editable in review modal) */}
        {!isEditable && <DetailRow label="ID del Paciente" value={patientId} />}

        {/* Delivery Date - Editable if handler provided */}
        {onFechaEntregaChange ? (
          <div>
            <Input
              label="Fecha de Entrega Deseada"
              type="date"
              value={fechaEntregaDeseada || ''}
              onChange={(e) => onFechaEntregaChange(e.target.value)}
              error={errors?.fechaEntregaDeseada}
            />
          </div>
        ) : (
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
        )}
      </dl>
    </>
  );
}
