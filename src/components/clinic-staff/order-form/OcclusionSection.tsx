'use client';

import { Select } from '@/components/ui/Select';
import { Radio } from '@/components/ui/Radio';
import { OcclusionInfo } from '@/types/order';

type OcclusionSectionProps = {
  oclusionDiseno?: OcclusionInfo;
  onChange: (value: OcclusionInfo | undefined) => void;
  errors?: {
    tipoOclusion?: string;
    espacioInteroclusalSuficiente?: string;
    solucionEspacioInsuficiente?: string;
  };
};

export function OcclusionSection({
  oclusionDiseno,
  onChange,
  errors,
}: OcclusionSectionProps) {
  const handleFieldChange = (field: keyof OcclusionInfo, value: unknown) => {
    const updated = {
      ...oclusionDiseno,
      [field]: value,
    } as OcclusionInfo;

    // Clear solution field if space is sufficient
    if (field === 'espacioInteroclusalSuficiente' && value === true) {
      delete updated.solucionEspacioInsuficiente;
    }

    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Oclusión y Diseño
      </h3>

      {/* Occlusion Type */}
      <Select
        label="Tipo de Oclusión"
        value={oclusionDiseno?.tipoOclusion || ''}
        onChange={(e) => handleFieldChange('tipoOclusion', e.target.value as OcclusionInfo['tipoOclusion'])}
        error={errors?.tipoOclusion}
      >
        <option value="">Selecciona un tipo</option>
        <option value="normal">Normal</option>
        <option value="clase_i">Clase I</option>
        <option value="clase_ii">Clase II</option>
        <option value="clase_iii">Clase III</option>
        <option value="borde_a_borde">Borde a Borde</option>
        <option value="mordida_cruzada">Mordida Cruzada</option>
      </Select>

      {/* Sufficient Interocclusal Space */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-foreground">
          ¿Espacio Interoclusal Suficiente?
        </label>
        <div className="space-y-3">
          <Radio
            name="espacioInteroclusalSuficiente"
            checked={oclusionDiseno?.espacioInteroclusalSuficiente === true}
            onChange={() => handleFieldChange('espacioInteroclusalSuficiente', true)}
            label="Sí"
          />

          <Radio
            name="espacioInteroclusalSuficiente"
            checked={oclusionDiseno?.espacioInteroclusalSuficiente === false}
            onChange={() => handleFieldChange('espacioInteroclusalSuficiente', false)}
            label="No"
          />
        </div>
        {errors?.espacioInteroclusalSuficiente && (
          <p className="mt-2 text-sm text-danger font-medium">
            {errors.espacioInteroclusalSuficiente}
          </p>
        )}
      </div>

      {/* Solution if Insufficient Space - Conditionally Rendered */}
      {oclusionDiseno?.espacioInteroclusalSuficiente === false && (
        <div className="rounded-lg bg-muted p-4">
          <Select
            label="Solución para Espacio Insuficiente"
            value={oclusionDiseno?.solucionEspacioInsuficiente || ''}
            onChange={(e) =>
              handleFieldChange(
                'solucionEspacioInsuficiente',
                e.target.value as OcclusionInfo['solucionEspacioInsuficiente']
              )
            }
            error={errors?.solucionEspacioInsuficiente}
          >
            <option value="">Selecciona una solución</option>
            <option value="reduccion_oclusal">Reducción Oclusal</option>
            <option value="aumento_vertical">Aumento Vertical</option>
            <option value="ambas">Ambas</option>
          </Select>
        </div>
      )}
    </div>
  );
}
