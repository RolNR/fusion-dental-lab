'use client';

import { forwardRef } from 'react';
import { CaseType } from '@prisma/client';
import { Textarea } from '@/components/ui/Textarea';
import { Icons } from '@/components/ui/Icons';
import {
  CollapsibleSubsection,
  FieldLabel,
  ToggleButtonGroup,
  ToggleOption,
} from '@/components/ui/form';

type CaseTypeSectionProps = {
  tipoCaso?: CaseType;
  motivoGarantia?: string;
  onChange: (updates: { tipoCaso?: CaseType; motivoGarantia?: string }) => void;
  errors?: {
    tipoCaso?: string;
    motivoGarantia?: string;
  };
  hasErrors?: boolean;
  errorCount?: number;
};

const CASE_TYPE_OPTIONS: ToggleOption<CaseType>[] = [
  { value: 'nuevo', label: 'Caso Nuevo', icon: 'filePlus' },
  { value: 'garantia', label: 'Garantía', icon: 'shield' },
  { value: 'regreso_prueba', label: 'Regreso de Prueba', icon: 'undo' },
  { value: 'reparacion_ajuste', label: 'Reparación o Ajuste', icon: 'wrench' },
];

export const CaseTypeSection = forwardRef<HTMLDivElement, CaseTypeSectionProps>(
  ({ tipoCaso, motivoGarantia, onChange, errors }, ref) => {
    const handleTipoCasoChange = (value: CaseType | undefined) => {
      if (!value) return; // Don't allow deselection for case type
      // Clear warranty fields when switching away from garantia
      if (value === 'nuevo') {
        onChange({ tipoCaso: value, motivoGarantia: undefined });
      } else {
        onChange({ tipoCaso: value });
      }
    };

    // Default to 'nuevo' if not set
    const effectiveTipoCaso = tipoCaso || 'nuevo';

    return (
      <div ref={ref}>
        <CollapsibleSubsection icon="fileText" title="Tipo de Caso">
          <div className="space-y-6">
            {/* Case Type Selection */}
            <div>
              <FieldLabel label="Selecciona el Tipo" required />
              <ToggleButtonGroup
                options={CASE_TYPE_OPTIONS}
                value={effectiveTipoCaso}
                onChange={handleTipoCasoChange}
                className="mt-2"
              />
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

                {/* Note about returning original work */}
                <div className="flex items-start gap-2 rounded-md bg-primary/10 p-3">
                  <Icons.info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-primary">
                    <strong>Nota:</strong> Es necesario devolver el trabajo original junto con la
                    orden de garantía.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSubsection>
      </div>
    );
  }
);

CaseTypeSection.displayName = 'CaseTypeSection';
