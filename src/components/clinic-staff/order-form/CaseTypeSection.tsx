'use client';

import { CaseType } from '@prisma/client';
import { Textarea } from '@/components/ui/Textarea';
import { Radio } from '@/components/ui/Radio';

type CaseTypeSectionProps = {
  tipoCaso?: CaseType;
  motivoGarantia?: string;
  seDevuelveTrabajoOriginal?: boolean;
  onChange: (updates: { tipoCaso?: CaseType; motivoGarantia?: string; seDevuelveTrabajoOriginal?: boolean }) => void;
  errors?: {
    tipoCaso?: string;
    motivoGarantia?: string;
    seDevuelveTrabajoOriginal?: string;
  };
};

export function CaseTypeSection({
  tipoCaso,
  motivoGarantia,
  seDevuelveTrabajoOriginal,
  onChange,
  errors,
}: CaseTypeSectionProps) {
  const handleTipoCasoChange = (value: CaseType) => {
    // Batch updates to avoid state update conflicts
    if (value === 'nuevo') {
      onChange({ tipoCaso: value, motivoGarantia: undefined, seDevuelveTrabajoOriginal: undefined });
    } else {
      onChange({ tipoCaso: value });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Tipo de Caso
        </h3>

        {/* Case Type Radio Buttons */}
        <div className="space-y-3">
          <Radio
            name="tipoCaso"
            value="nuevo"
            checked={tipoCaso === 'nuevo' || !tipoCaso}
            onChange={(e) => handleTipoCasoChange(e.target.value as CaseType)}
            label="Nuevo"
          />

          <Radio
            name="tipoCaso"
            value="garantia"
            checked={tipoCaso === 'garantia'}
            onChange={(e) => handleTipoCasoChange(e.target.value as CaseType)}
            label="Garantía"
          />
        </div>

        {errors?.tipoCaso && (
          <p className="mt-2 text-sm text-danger font-medium">{errors.tipoCaso}</p>
        )}
      </div>

      {/* Warranty Fields - Conditionally Rendered */}
      {tipoCaso === 'garantia' && (
        <div className="space-y-4 rounded-lg bg-muted p-4">
          {/* Warranty Reason */}
          <Textarea
            label="Motivo de Garantía"
            required
            value={motivoGarantia || ''}
            onChange={(e) => onChange({ motivoGarantia: e.target.value })}
            placeholder="Describe el motivo de la garantía..."
            rows={3}
            error={errors?.motivoGarantia}
          />

          {/* Returns Original Work */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-foreground">
              ¿Se devuelve el trabajo original?
              <span className="ml-1 text-danger">*</span>
            </label>
            <div className="space-y-3">
              <Radio
                name="seDevuelveTrabajoOriginal"
                checked={seDevuelveTrabajoOriginal === true}
                onChange={() => onChange({ seDevuelveTrabajoOriginal: true })}
                label="Sí"
              />

              <Radio
                name="seDevuelveTrabajoOriginal"
                checked={seDevuelveTrabajoOriginal === false}
                onChange={() => onChange({ seDevuelveTrabajoOriginal: false })}
                label="No"
              />
            </div>
            {errors?.seDevuelveTrabajoOriginal && (
              <p className="mt-2 text-sm text-danger font-medium">
                {errors.seDevuelveTrabajoOriginal}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
