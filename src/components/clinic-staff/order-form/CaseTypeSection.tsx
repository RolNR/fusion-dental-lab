'use client';

import { forwardRef } from 'react';
import { CaseType } from '@prisma/client';
import { Textarea } from '@/components/ui/Textarea';
import { SectionContainer, SectionHeader, ButtonCard, FieldLabel } from '@/components/ui/form';

type CaseTypeSectionProps = {
  tipoCaso?: CaseType;
  motivoGarantia?: string;
  seDevuelveTrabajoOriginal?: boolean;
  onChange: (updates: {
    tipoCaso?: CaseType;
    motivoGarantia?: string;
    seDevuelveTrabajoOriginal?: boolean;
  }) => void;
  errors?: {
    tipoCaso?: string;
    motivoGarantia?: string;
    seDevuelveTrabajoOriginal?: string;
  };
  hasErrors?: boolean;
  errorCount?: number;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
};

export const CaseTypeSection = forwardRef<HTMLDivElement, CaseTypeSectionProps>(
  (
    {
      tipoCaso,
      motivoGarantia,
      seDevuelveTrabajoOriginal,
      onChange,
      errors,
      hasErrors,
      errorCount,
      collapsed,
      onCollapseChange,
    },
    ref
  ) => {
    const handleTipoCasoChange = (value: CaseType) => {
      // Batch updates to avoid state update conflicts
      if (value === 'nuevo') {
        onChange({
          tipoCaso: value,
          motivoGarantia: undefined,
          seDevuelveTrabajoOriginal: undefined,
        });
      } else {
        onChange({ tipoCaso: value });
      }
    };

    const caseTypes = [
      {
        value: 'nuevo',
        label: 'Caso Nuevo',
        subtitle: 'Trabajo inicial',
        icon: 'filePlus' as const,
      },
      {
        value: 'garantia',
        label: 'Garantía',
        subtitle: 'Corrección o reemplazo',
        icon: 'shield' as const,
      },
    ];

    return (
      <SectionContainer
        ref={ref}
        hasErrors={hasErrors}
        errorCount={errorCount}
        collapsed={collapsed}
        onCollapseChange={onCollapseChange}
      >
        <SectionHeader
          icon="fileText"
          title="Tipo de Caso"
          description="Indica si es un caso nuevo o garantía"
          required
        />

        <div className="space-y-6 p-6">
          {/* Case Type Selection */}
          <div>
            <FieldLabel label="Selecciona el Tipo" required />
            <div className="grid grid-cols-2 gap-3">
              {caseTypes.map((type) => (
                <ButtonCard
                  key={type.value}
                  icon={type.icon}
                  title={type.label}
                  subtitle={type.subtitle}
                  selected={tipoCaso === type.value || (!tipoCaso && type.value === 'nuevo')}
                  onClick={() => handleTipoCasoChange(type.value as CaseType)}
                />
              ))}
            </div>
            {errors?.tipoCaso && (
              <p className="mt-2 text-sm text-danger font-medium">{errors.tipoCaso}</p>
            )}
          </div>

          {/* Warranty Fields - Conditionally Rendered */}
          {tipoCaso === 'garantia' && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
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
                <FieldLabel label="¿Se devuelve el trabajo original?" required />
                <div className="grid grid-cols-2 gap-3">
                  <ButtonCard
                    icon="check"
                    title="Sí"
                    subtitle="Se incluye el trabajo original"
                    selected={seDevuelveTrabajoOriginal === true}
                    onClick={() => onChange({ seDevuelveTrabajoOriginal: true })}
                  />
                  <ButtonCard
                    icon="x"
                    title="No"
                    subtitle="No se devuelve"
                    selected={seDevuelveTrabajoOriginal === false}
                    onClick={() => onChange({ seDevuelveTrabajoOriginal: false })}
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
      </SectionContainer>
    );
  }
);

CaseTypeSection.displayName = 'CaseTypeSection';
