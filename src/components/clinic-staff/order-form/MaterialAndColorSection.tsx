'use client';

import { Input } from '@/components/ui/Input';
import { SectionContainer, SectionHeader } from '@/components/ui/form';

type MaterialAndColorSectionProps = {
  material: string;
  materialBrand: string;
  color: string;
  onChange: (field: 'material' | 'materialBrand' | 'color', value: string) => void;
  errors?: {
    material?: string;
    materialBrand?: string;
    color?: string;
  };
  disabled?: boolean;
};

export function MaterialAndColorSection({
  material,
  materialBrand,
  color,
  onChange,
  errors,
  disabled = false,
}: MaterialAndColorSectionProps) {
  return (
    <SectionContainer>
      <SectionHeader
        icon="layers"
        title="Material y Color"
        description="Especificaciones del material y tonalidad"
      />

      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Input
            label="Material"
            type="text"
            value={material}
            onChange={(e) => onChange('material', e.target.value)}
            disabled={disabled}
            placeholder="Zirconia, Porcelana..."
            error={errors?.material}
          />

          <Input
            label="Marca del Material"
            type="text"
            value={materialBrand}
            onChange={(e) => onChange('materialBrand', e.target.value)}
            disabled={disabled}
            placeholder="IPS e.max..."
            error={errors?.materialBrand}
          />

          <Input
            label="Color"
            type="text"
            value={color}
            onChange={(e) => onChange('color', e.target.value)}
            disabled={disabled}
            placeholder="A2, B1..."
            error={errors?.color}
          />
        </div>
      </div>
    </SectionContainer>
  );
}
