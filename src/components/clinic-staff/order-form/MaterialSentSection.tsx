'use client';

import { Checkbox } from '@/components/ui/Checkbox';

type MaterialSentSectionProps = {
  materialSent?: Record<string, boolean>;
  onChange: (value: Record<string, boolean> | undefined) => void;
  errors?: {
    materialSent?: string;
  };
};

// Common materials that can be sent to the lab
const COMMON_MATERIALS = [
  { key: 'antagonista', label: 'Antagonista' },
  { key: 'arcada_completa', label: 'Arcada Completa' },
  { key: 'modelo_articulado', label: 'Modelo Articulado' },
  { key: 'llave_silicona', label: 'Llave de Silicona' },
  { key: 'registro_mordida', label: 'Registro de Mordida' },
  { key: 'fotografia', label: 'Fotografía' },
  { key: 'radiografia', label: 'Radiografía' },
];

export function MaterialSentSection({
  materialSent,
  onChange,
  errors,
}: MaterialSentSectionProps) {
  const handleMaterialToggle = (key: string, checked: boolean) => {
    const updated = {
      ...materialSent,
      [key]: checked,
    };

    // Remove false values to keep the object clean
    if (!checked) {
      delete updated[key];
    }

    // If no materials selected, set to undefined
    const hasAnySelected = Object.values(updated).some(v => v === true);
    onChange(hasAnySelected ? updated : undefined);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Materiales Enviados
      </h3>
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Marca los materiales que se están enviando al laboratorio
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMMON_MATERIALS.map((material) => (
          <Checkbox
            key={material.key}
            label={material.label}
            checked={materialSent?.[material.key] === true}
            onChange={(e) => handleMaterialToggle(material.key, e.target.checked)}
          />
        ))}
      </div>

      {errors?.materialSent && (
        <p className="mt-2 text-sm text-danger font-medium">{errors.materialSent}</p>
      )}
    </div>
  );
}
