'use client';

import { RestorationType } from '@prisma/client';
import { CollapsibleSubsection, ButtonCard, FieldLabel } from '@/components/ui/form';

type WorkTypeSectionProps = {
  tipoRestauracion?: RestorationType;
  onChange: (updates: { tipoRestauracion?: RestorationType }) => void;
  errors?: {
    tipoRestauracion?: string;
  };
};

export function WorkTypeSection({ tipoRestauracion, onChange, errors }: WorkTypeSectionProps) {
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
    <CollapsibleSubsection icon="settings" title="Tipo de Restauración">
      <div className="space-y-4">
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
    </CollapsibleSubsection>
  );
}
