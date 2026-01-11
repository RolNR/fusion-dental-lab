'use client';

import { Input } from '@/components/ui/Input';
import {
  SectionContainer,
  SectionHeader,
} from '@/components/ui/form';

type OrderInfoSectionProps = {
  patientName: string;
  fechaEntregaDeseada?: string;
  onChange: (field: 'patientName' | 'fechaEntregaDeseada', value: string) => void;
  errors?: {
    patientName?: string;
    fechaEntregaDeseada?: string;
  };
  disabled?: boolean;
};

export function OrderInfoSection({
  patientName,
  fechaEntregaDeseada,
  onChange,
  errors,
  disabled = false,
}: OrderInfoSectionProps) {
  return (
    <SectionContainer>
      <SectionHeader
        icon="user"
        title="Información de la Orden"
        description="Datos básicos del paciente y entrega"
        required
      />

      <div className="space-y-4 p-6">
        <Input
          label="Nombre del Paciente"
          type="text"
          value={patientName}
          onChange={(e) => onChange('patientName', e.target.value)}
          required
          disabled={disabled}
          placeholder="Juan Pérez"
          error={errors?.patientName}
        />

        <Input
          label="Fecha de Entrega Deseada"
          type="date"
          value={fechaEntregaDeseada || ''}
          onChange={(e) => onChange('fechaEntregaDeseada', e.target.value)}
          disabled={disabled}
          helperText="Fecha en que necesitas el trabajo completado"
          error={errors?.fechaEntregaDeseada}
        />
      </div>
    </SectionContainer>
  );
}
