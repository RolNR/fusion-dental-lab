'use client';

import { WorkType, RestorationType } from '@prisma/client';
import { Radio } from '@/components/ui/Radio';
import { Select } from '@/components/ui/Select';

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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Tipo de Trabajo
        </h3>

        {/* Work Type Radio Buttons */}
        <div className="space-y-3">
          <Radio
            name="tipoTrabajo"
            value="restauracion"
            checked={tipoTrabajo === 'restauracion' || !tipoTrabajo}
            onChange={(e) => handleTipoTrabajoChange(e.target.value as WorkType)}
            label="Restauración"
          />

          <Radio
            name="tipoTrabajo"
            value="otro"
            checked={tipoTrabajo === 'otro'}
            onChange={(e) => handleTipoTrabajoChange(e.target.value as WorkType)}
            label="Otro"
          />
        </div>

        {errors?.tipoTrabajo && (
          <p className="mt-2 text-sm text-danger font-medium">{errors.tipoTrabajo}</p>
        )}
      </div>

      {/* Restoration Type - Conditionally Rendered */}
      {tipoTrabajo === 'restauracion' && (
        <div className="rounded-lg bg-muted p-4">
          <Select
            label="Tipo de Restauración"
            value={tipoRestauracion || ''}
            onChange={(e) => onChange({ tipoRestauracion: (e.target.value || undefined) as RestorationType | undefined })}
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
  );
}
