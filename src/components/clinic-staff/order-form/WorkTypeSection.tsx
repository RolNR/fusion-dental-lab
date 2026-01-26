'use client';

import { RestorationType } from '@prisma/client';
import { CollapsibleSubsection, FieldLabel, ToggleButtonGroup, ToggleOption } from '@/components/ui/form';

type WorkTypeSectionProps = {
  tipoRestauracion?: RestorationType;
  onChange: (updates: { tipoRestauracion?: RestorationType }) => void;
  errors?: {
    tipoRestauracion?: string;
  };
};

const RESTORATION_TYPE_OPTIONS: ToggleOption<RestorationType>[] = [
  { value: 'corona', label: 'Corona', icon: 'settings' },
  { value: 'puente', label: 'Puente', icon: 'copy' },
  { value: 'inlay', label: 'Inlay', icon: 'upload' },
  { value: 'onlay', label: 'Onlay', icon: 'file' },
  { value: 'carilla', label: 'Carilla', icon: 'user' },
  { value: 'provisional', label: 'Provisional', icon: 'alertCircle' },
];

export function WorkTypeSection({ tipoRestauracion, onChange, errors }: WorkTypeSectionProps) {
  return (
    <CollapsibleSubsection icon="settings" title="Tipo de Restauración">
      <div className="space-y-4">
        <FieldLabel label="Tipo de Restauración" required />
        <ToggleButtonGroup
          options={RESTORATION_TYPE_OPTIONS}
          value={tipoRestauracion}
          onChange={(value) => onChange({ tipoRestauracion: value })}
        />
        {errors?.tipoRestauracion && (
          <p className="mt-2 text-sm text-danger font-medium">{errors.tipoRestauracion}</p>
        )}
      </div>
    </CollapsibleSubsection>
  );
}
