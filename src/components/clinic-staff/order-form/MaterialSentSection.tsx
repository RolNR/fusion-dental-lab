'use client';

import { Checkbox } from '@/components/ui/Checkbox';
import { SectionContainer, SectionHeader } from '@/components/ui/form';

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

export function MaterialSentSection({ materialSent, onChange, errors }: MaterialSentSectionProps) {
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
    const hasAnySelected = Object.values(updated).some((v) => v === true);
    onChange(hasAnySelected ? updated : undefined);
  };

  return (
    <SectionContainer>
      <SectionHeader
        icon="upload"
        title="Materiales Enviados"
        description="Marca los materiales que se están enviando al laboratorio"
      />

      <div className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COMMON_MATERIALS.map((material) => (
            <div key={material.key} className="rounded-lg border border-border bg-muted/30 p-3">
              <Checkbox
                label={material.label}
                checked={materialSent?.[material.key] === true}
                onChange={(e) => handleMaterialToggle(material.key, e.target.checked)}
              />
            </div>
          ))}
        </div>

        {errors?.materialSent && (
          <p className="mt-2 text-sm text-danger font-medium">{errors.materialSent}</p>
        )}
      </div>
    </SectionContainer>
  );
}
