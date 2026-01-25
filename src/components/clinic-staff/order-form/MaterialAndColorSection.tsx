'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ColorInfo, SHADE_SYSTEMS } from '@/types/order';
import { CollapsibleSubsection } from '@/components/ui/form';

type MaterialAndColorSectionProps = {
  material: string;
  colorInfo?: ColorInfo;
  onMaterialChange: (value: string) => void;
  onColorInfoChange: (value: ColorInfo | undefined) => void;
  errors?: {
    material?: string;
    shadeType?: string;
    shadeCode?: string;
  };
  disabled?: boolean;
};

export function MaterialAndColorSection({
  material,
  colorInfo,
  onMaterialChange,
  onColorInfoChange,
  errors,
  disabled = false,
}: MaterialAndColorSectionProps) {
  const handleColorFieldChange = <K extends keyof ColorInfo>(field: K, value: ColorInfo[K]) => {
    const updated = {
      shadeType: colorInfo?.shadeType ?? null,
      shadeCode: colorInfo?.shadeCode ?? null,
      texture: colorInfo?.texture ?? [],
      gloss: colorInfo?.gloss ?? [],
      ...colorInfo,
      [field]: value,
    } as ColorInfo;

    onColorInfoChange(updated);
  };

  return (
    <CollapsibleSubsection icon="layers" title="Material y Color">
      <div className="space-y-6">
        {/* Material Field */}
        <Input
          label="Material"
          type="text"
          value={material}
          onChange={(e) => onMaterialChange(e.target.value)}
          disabled={disabled}
          placeholder="Zirconia, Porcelana..."
          error={errors?.material}
        />

        {/* Shade System and Code */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Sistema de Tonalidad"
            value={colorInfo?.shadeType || ''}
            onChange={(e) => handleColorFieldChange('shadeType', e.target.value || null)}
            helperText="Sistema de color utilizado"
            error={errors?.shadeType}
            disabled={disabled}
          >
            <option value="">Seleccionar sistema</option>
            {SHADE_SYSTEMS.map((system) => (
              <option key={system.value} value={system.value}>
                {system.label}
              </option>
            ))}
          </Select>

          <Input
            label="Código de Tonalidad"
            type="text"
            value={colorInfo?.shadeCode || ''}
            onChange={(e) => handleColorFieldChange('shadeCode', e.target.value || null)}
            placeholder="A2, B1, 1M2..."
            helperText="Código específico del color"
            error={errors?.shadeCode}
            disabled={disabled}
          />
        </div>
      </div>
    </CollapsibleSubsection>
  );
}
