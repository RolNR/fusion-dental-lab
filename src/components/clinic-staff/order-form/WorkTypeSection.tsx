'use client';

import { WorkType, RestorationType } from '@prisma/client';
import { Select } from '@/components/ui/Select';
import { SectionContainer, SectionHeader, ButtonCard, FieldLabel } from '@/components/ui/form';

type WorkTypeSectionProps = {
  tipoTrabajo?: WorkType;
  tipoRestauracion?: RestorationType;
  onChange: (updates: { tipoTrabajo?: WorkType; tipoRestauracion?: RestorationType }) => void;
  errors?: {
    tipoTrabajo?: string;
    tipoRestauracion?: string;
  };
};

export function WorkTypeSection({
  tipoTrabajo,
  tipoRestauracion,
  onChange,
  errors,
}: WorkTypeSectionProps) {
  const handleTipoTrabajoChange = (value: WorkType) => {
    // Batch updates to avoid state update conflicts
    if (value === 'otro') {
      onChange({ tipoTrabajo: value, tipoRestauracion: undefined });
    } else {
      onChange({ tipoTrabajo: value });
    }
  };

  const workTypes = [
    {
      value: 'restauracion',
      label: 'Restauración',
      subtitle: 'Trabajo de restauración dental',
      icon: 'settings' as const,
    },
    { value: 'otro', label: 'Otro', subtitle: 'Otro tipo de trabajo', icon: 'file' as const },
  ];

  return (
    <SectionContainer>
      <SectionHeader
        icon="settings"
        title="Tipo de Trabajo"
        description="Selecciona el tipo de trabajo a realizar"
        required
      />

      <div className="space-y-6 p-6">
        {/* Work Type Selection */}
        <div>
          <FieldLabel label="Tipo de Trabajo" required />
          <div className="grid grid-cols-2 gap-3">
            {workTypes.map((type) => (
              <ButtonCard
                key={type.value}
                icon={type.icon}
                title={type.label}
                subtitle={type.subtitle}
                selected={
                  tipoTrabajo === type.value || (!tipoTrabajo && type.value === 'restauracion')
                }
                onClick={() => handleTipoTrabajoChange(type.value as WorkType)}
              />
            ))}
          </div>
          {errors?.tipoTrabajo && (
            <p className="mt-2 text-sm text-danger font-medium">{errors.tipoTrabajo}</p>
          )}
        </div>

        {/* Restoration Type - Conditionally Rendered */}
        {tipoTrabajo === 'restauracion' && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <Select
              label="Tipo de Restauración"
              value={tipoRestauracion || ''}
              onChange={(e) =>
                onChange({
                  tipoRestauracion: (e.target.value || undefined) as RestorationType | undefined,
                })
              }
              error={errors?.tipoRestauracion}
            >
              <option value="">Selecciona un tipo</option>
              <option value="corona">Corona</option>
              <option value="puente">Puente</option>
              <option value="inlay">Inlay</option>
              <option value="onlay">Onlay</option>
              <option value="carilla">Carilla</option>
              <option value="provisional">Provisional</option>
            </Select>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
