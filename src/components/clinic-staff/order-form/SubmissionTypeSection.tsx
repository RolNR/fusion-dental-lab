'use client';

import { forwardRef, useEffect } from 'react';
import { SubmissionType, ArticulatedBy } from '@prisma/client';
import { CollapsibleSubsection, ButtonCard, FieldLabel } from '@/components/ui/form';
import { Icons } from '@/components/ui/Icons';

type SubmissionTypeSectionProps = {
  submissionType?: SubmissionType;
  articulatedBy?: ArticulatedBy;
  onChange: (field: string, value: string | undefined) => void;
  errors?: {
    submissionType?: string;
    articulatedBy?: string;
  };
  hasErrors?: boolean;
  errorCount?: number;
  hasImplant?: boolean;
};

export const SubmissionTypeSection = forwardRef<HTMLDivElement, SubmissionTypeSectionProps>(
  ({ submissionType, articulatedBy, onChange, errors, hasImplant = false }, ref) => {
    const submissionTypes = [
      {
        value: 'prueba',
        label: 'Prueba',
        subtitle: 'Verificación antes de finalizar',
        icon: 'eye' as const,
      },
      {
        value: 'terminado',
        label: 'Terminado',
        subtitle: 'Trabajo finalizado',
        icon: 'check' as const,
      },
    ];

    const articulatedByOptions = [
      {
        value: 'doctor',
        label: 'Doctor',
        subtitle: 'Articulado por el doctor',
        icon: 'user' as const,
      },
      {
        value: 'laboratorio',
        label: 'Laboratorio',
        subtitle: 'Articulado por el laboratorio',
        icon: 'settings' as const,
      },
    ];

    // Auto-select "prueba" when any tooth has implant
    useEffect(() => {
      if (hasImplant && submissionType !== 'prueba') {
        onChange('submissionType', 'prueba');
      }
    }, [hasImplant, submissionType, onChange]);

    // Determine the effective selected value (handle legacy values)
    const effectiveSubmissionType =
      submissionType === 'prueba_estructura' || submissionType === 'prueba_estetica'
        ? 'prueba'
        : submissionType;

    return (
      <div ref={ref}>
        <CollapsibleSubsection icon="upload" title="Tipo de Entrega y Articulación">
          <div className="space-y-6">
            {/* Submission Type */}
            <div>
              <FieldLabel label="Tipo de Entrega" required />

              {/* Implant notice */}
              {hasImplant && (
                <div className="mb-3 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
                  <Icons.screw className="h-4 w-4 shrink-0" />
                  <span>
                    Como hay trabajo sobre implante, se requiere <strong>Prueba</strong> antes de
                    finalizar.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {submissionTypes.map((type) => {
                  const isDisabled = hasImplant && type.value === 'terminado';
                  return (
                    <ButtonCard
                      key={type.value}
                      icon={type.icon}
                      title={type.label}
                      subtitle={type.subtitle}
                      selected={
                        effectiveSubmissionType === type.value ||
                        (!effectiveSubmissionType && type.value === 'terminado')
                      }
                      onClick={() => !isDisabled && onChange('submissionType', type.value)}
                      disabled={isDisabled}
                    />
                  );
                })}
              </div>
              {errors?.submissionType && (
                <p className="mt-2 text-sm text-danger font-medium">{errors.submissionType}</p>
              )}
            </div>

            {/* Articulated By */}
            <div>
              <FieldLabel label="Articulado Por" required />
              <div className="grid grid-cols-2 gap-3">
                {articulatedByOptions.map((option) => (
                  <ButtonCard
                    key={option.value}
                    icon={option.icon}
                    title={option.label}
                    subtitle={option.subtitle}
                    selected={
                      articulatedBy === option.value ||
                      (!articulatedBy && option.value === 'doctor')
                    }
                    onClick={() => onChange('articulatedBy', option.value)}
                  />
                ))}
              </div>
              {errors?.articulatedBy && (
                <p className="mt-2 text-sm text-danger font-medium">{errors.articulatedBy}</p>
              )}
            </div>
          </div>
        </CollapsibleSubsection>
      </div>
    );
  }
);

SubmissionTypeSection.displayName = 'SubmissionTypeSection';
