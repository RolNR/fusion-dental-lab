'use client';

import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Range } from '@/components/ui/Range';
import { ColorInfo } from '@/types/order';
import { SectionContainer, SectionHeader, ButtonCard, FieldLabel } from '@/components/ui/form';

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

export function ColorExtendedSection({ colorInfo, onChange, errors }: ColorExtendedSectionProps) {
  const handleFieldChange = <K extends keyof ColorInfo>(field: K, value: ColorInfo[K]) => {
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

  const handleTranslucencyChange = (field: 'level' | 'description', value: number | string) => {
    handleFieldChange('translucency', {
      level: colorInfo?.translucency?.level ?? 5,
      description: colorInfo?.translucency?.description ?? '',
      [field]: value,
    });
  };

  return (
    <SectionContainer>
      <SectionHeader
        icon="eye"
        title="Información de Color Extendida"
        description="Especifica los detalles de color y translucidez"
      />

      <div className="space-y-6 p-6">
        {/* Shade System and Code */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <FieldLabel label="Mamelones" />
          <div className="grid grid-cols-2 gap-3">
            <ButtonCard
              icon="check"
              title="Sí"
              subtitle="Con mamelones"
              selected={colorInfo?.mamelones === 'si'}
              onClick={() => handleFieldChange('mamelones', 'si')}
            />
            <ButtonCard
              icon="x"
              title="No"
              subtitle="Sin mamelones"
              selected={colorInfo?.mamelones === 'no' || !colorInfo?.mamelones}
              onClick={() => handleFieldChange('mamelones', 'no')}
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
    </SectionContainer>
  );
}
