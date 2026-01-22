'use client';

import { WorkType, RestorationType } from '@prisma/client';
import { CollapsibleSubsection, ButtonCard, FieldLabel } from '@/components/ui/form';

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

  const restorationTypes = [
    {
      value: 'corona',
      label: 'Corona',
      subtitle: 'Restauración completa',
      icon: 'settings' as const,
    },
    {
      value: 'puente',
      label: 'Puente',
      subtitle: 'Prótesis fija',
      icon: 'copy' as const,
    },
    {
      value: 'inlay',
      label: 'Inlay',
      subtitle: 'Restauración interna',
      icon: 'upload' as const,
    },
    {
      value: 'onlay',
      label: 'Onlay',
      subtitle: 'Restauración externa',
      icon: 'file' as const,
    },
    {
      value: 'carilla',
      label: 'Carilla',
      subtitle: 'Recubrimiento estético',
      icon: 'user' as const,
    },
    {
      value: 'provisional',
      label: 'Provisional',
      subtitle: 'Restauración temporal',
      icon: 'alertCircle' as const,
    },
  ];

  return (
    <CollapsibleSubsection icon="settings" title="Tipo de Trabajo">
      <div className="space-y-6">
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
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <FieldLabel label="Tipo de Restauración" required />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {restorationTypes.map((type) => (
                <ButtonCard
                  key={type.value}
                  icon={type.icon}
                  title={type.label}
                  subtitle={type.subtitle}
                  selected={tipoRestauracion === type.value}
                  onClick={() =>
                    onChange({
                      tipoRestauracion: type.value as RestorationType,
                    })
                  }
                />
              ))}
            </div>
            {errors?.tipoRestauracion && (
              <p className="mt-2 text-sm text-danger font-medium">{errors.tipoRestauracion}</p>
            )}
          </div>
        )}
      </div>
    </CollapsibleSubsection>
  );
}
