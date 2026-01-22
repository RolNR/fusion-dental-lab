'use client';

import { forwardRef } from 'react';
import { Input } from '@/components/ui/Input';
import { CollapsibleSubsection } from '@/components/ui/form';

type OrderInfoSectionProps = {
  patientName: string;
  fechaEntregaDeseada?: string;
  onChange: (field: 'patientName' | 'fechaEntregaDeseada', value: string) => void;
  errors?: {
    patientName?: string;
    fechaEntregaDeseada?: string;
  };
  disabled?: boolean;
  hasErrors?: boolean;
  errorCount?: number;
};

export const OrderInfoSection = forwardRef<HTMLDivElement, OrderInfoSectionProps>(
  ({ patientName, fechaEntregaDeseada, onChange, errors, disabled = false }, ref) => {
    return (
      <div ref={ref}>
        <CollapsibleSubsection icon="user" title="Información de la Orden">
          <div className="space-y-4">
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
        </CollapsibleSubsection>
      </div>
    );
  }
);

OrderInfoSection.displayName = 'OrderInfoSection';
