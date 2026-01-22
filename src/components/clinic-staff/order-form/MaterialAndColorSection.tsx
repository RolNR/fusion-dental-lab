'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Range } from '@/components/ui/Range';
import { ColorInfo, SHADE_SYSTEMS } from '@/types/order';
import { CollapsibleSubsection, ButtonCard, FieldLabel } from '@/components/ui/form';

type MaterialAndColorSectionProps = {
  material: string;
  materialBrand: string;
  colorInfo?: ColorInfo;
  onMaterialChange: (field: 'material' | 'materialBrand', value: string) => void;
  onColorInfoChange: (value: ColorInfo | undefined) => void;
  errors?: {
    material?: string;
    materialBrand?: string;
    shadeType?: string;
    shadeCode?: string;
    mamelones?: string;
    translucencyLevel?: string;
    translucencyDescription?: string;
  };
  disabled?: boolean;
};

export function MaterialAndColorSection({
  material,
  materialBrand,
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
        mamelones: colorInfo?.mamelones ?? 'no',
        translucency: colorInfo?.translucency ?? {
          level: 5,
          description: '',
        },
        ...colorInfo,
        [field]: value,
      } as ColorInfo;

      onColorInfoChange(updated);
    };

    const handleTranslucencyChange = (field: 'level' | 'description', value: number | string) => {
      handleColorFieldChange('translucency', {
        level: colorInfo?.translucency?.level ?? 5,
        description: colorInfo?.translucency?.description ?? '',
        [field]: value,
      });
    };

  return (
    <CollapsibleSubsection icon="layers" title="Material y Color">
      <div className="space-y-6">
          {/* Material Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Material"
              type="text"
              value={material}
              onChange={(e) => onMaterialChange('material', e.target.value)}
              disabled={disabled}
              placeholder="Zirconia, Porcelana..."
              error={errors?.material}
            />

            <Input
              label="Marca del Material"
              type="text"
              value={materialBrand}
              onChange={(e) => onMaterialChange('materialBrand', e.target.value)}
              disabled={disabled}
              placeholder="IPS e.max..."
              error={errors?.materialBrand}
            />
          </div>

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

          {/* Mamelones */}
          <div>
            <FieldLabel label="Mamelones" />
            <div className="grid grid-cols-2 gap-3">
              <ButtonCard
                icon="check"
                title="Sí"
                subtitle="Con mamelones"
                selected={colorInfo?.mamelones === 'si'}
                onClick={() => handleColorFieldChange('mamelones', 'si')}
              />
              <ButtonCard
                icon="x"
                title="No"
                subtitle="Sin mamelones"
                selected={colorInfo?.mamelones === 'no' || !colorInfo?.mamelones}
                onClick={() => handleColorFieldChange('mamelones', 'no')}
              />
            </div>
            {errors?.mamelones && (
              <p className="mt-2 text-sm text-danger font-medium">{errors.mamelones}</p>
            )}
          </div>

          {/* Translucency */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Translucidez</h4>

            <Range
              label="Nivel"
              min={1}
              max={10}
              value={colorInfo?.translucency?.level ?? 5}
              onChange={(e) => handleTranslucencyChange('level', parseInt(e.target.value))}
              error={errors?.translucencyLevel}
              helperText="Opaco (1) - Transparente (10)"
            />

            <Textarea
              label="Descripción de Translucidez"
              value={colorInfo?.translucency?.description ?? ''}
              onChange={(e) => handleTranslucencyChange('description', e.target.value)}
              placeholder="Describe las características de translucidez deseadas..."
              rows={2}
              error={errors?.translucencyDescription}
            />
          </div>
      </div>
    </CollapsibleSubsection>
  );
}
