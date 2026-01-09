'use client';

import { Input } from '@/components/ui/Input';
import { Radio } from '@/components/ui/Radio';
import { Textarea } from '@/components/ui/Textarea';
import { Range } from '@/components/ui/Range';
import { ColorInfo } from '@/types/order';

type ColorExtendedSectionProps = {
  colorInfo?: ColorInfo;
  onChange: (value: ColorInfo | undefined) => void;
  errors?: {
    shadeType?: string;
    shadeCode?: string;
    mamelones?: string;
    translucencyLevel?: string;
    translucencyDescription?: string;
  };
};

export function ColorExtendedSection({
  colorInfo,
  onChange,
  errors,
}: ColorExtendedSectionProps) {
  const handleFieldChange = <K extends keyof ColorInfo>(
    field: K,
    value: ColorInfo[K]
  ) => {
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

    onChange(updated);
  };

  const handleTranslucencyChange = (
    field: 'level' | 'description',
    value: number | string
  ) => {
    handleFieldChange('translucency', {
      level: colorInfo?.translucency?.level ?? 5,
      description: colorInfo?.translucency?.description ?? '',
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Información de Color Extendida
      </h3>

      {/* Shade System and Code */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Sistema de Tonalidad"
          type="text"
          value={colorInfo?.shadeType || ''}
          onChange={(e) => handleFieldChange('shadeType', e.target.value || null)}
          placeholder="VITA Classical, VITA 3D-Master..."
          helperText="Sistema de color utilizado"
          error={errors?.shadeType}
        />

        <Input
          label="Código de Tonalidad"
          type="text"
          value={colorInfo?.shadeCode || ''}
          onChange={(e) => handleFieldChange('shadeCode', e.target.value || null)}
          placeholder="A2, B1, 1M2..."
          helperText="Código específico del color"
          error={errors?.shadeCode}
        />
      </div>

      {/* Mamelones */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-foreground">
          Mamelones
        </label>
        <div className="space-y-3">
          <Radio
            name="mamelones"
            value="si"
            checked={colorInfo?.mamelones === 'si'}
            onChange={(e) => handleFieldChange('mamelones', e.target.value as 'si' | 'no')}
            label="Sí"
          />

          <Radio
            name="mamelones"
            value="no"
            checked={colorInfo?.mamelones === 'no' || !colorInfo?.mamelones}
            onChange={(e) => handleFieldChange('mamelones', e.target.value as 'si' | 'no')}
            label="No"
          />
        </div>
        {errors?.mamelones && (
          <p className="mt-2 text-sm text-danger font-medium">{errors.mamelones}</p>
        )}
      </div>

      {/* Translucency */}
      <div className="space-y-3 rounded-lg bg-muted p-4">
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
  );
}
