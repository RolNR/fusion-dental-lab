'use client';

import { forwardRef, useEffect, useMemo } from 'react';
import { SubmissionType, ArticulatedBy } from '@prisma/client';
import { CollapsibleSubsection, FieldLabel, ToggleButtonGroup, ToggleOption } from '@/components/ui/form';
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

const ARTICULATED_BY_OPTIONS: ToggleOption<ArticulatedBy>[] = [
  { value: 'doctor', label: 'Doctor', icon: 'user' },
  { value: 'laboratorio', label: 'Laboratorio', icon: 'settings' },
];

export const SubmissionTypeSection = forwardRef<HTMLDivElement, SubmissionTypeSectionProps>(
  ({ submissionType, articulatedBy, onChange, errors, hasImplant = false }, ref) => {
    // Build submission type options with dynamic disabled state
    const submissionTypeOptions: ToggleOption<SubmissionType>[] = useMemo(
      () => [
        { value: 'prueba', label: 'Prueba', icon: 'eye' },
        { value: 'terminado', label: 'Terminado', icon: 'check', disabled: hasImplant },
      ],
      [hasImplant]
    );

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
        : submissionType || 'terminado';

    const effectiveArticulatedBy = articulatedBy || 'doctor';

    return (
      <div ref={ref}>
        <CollapsibleSubsection icon="upload" title="Tipo de Entrega y Articulación">
          <div className="space-y-4">
            {/* Implant notice */}
            {hasImplant && (
              <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
                <Icons.screw className="h-4 w-4 shrink-0" />
                <span>
                  Como hay trabajo sobre implante, se requiere <strong>Prueba</strong> antes de
                  finalizar.
                </span>
              </div>
            )}

            {/* Submission Type - inline layout */}
            <div className="flex items-center justify-between gap-4">
              <FieldLabel label="Tipo de Entrega" required className="mb-0 shrink-0" />
              <ToggleButtonGroup
                options={submissionTypeOptions}
                value={effectiveSubmissionType}
                onChange={(value) => onChange('submissionType', value)}
              />
            </div>
            {errors?.submissionType && (
              <p className="text-sm text-danger font-medium">{errors.submissionType}</p>
            )}

            {/* Articulated By - inline layout */}
            <div className="flex items-center justify-between gap-4">
              <FieldLabel label="Articulado Por" required className="mb-0 shrink-0" />
              <ToggleButtonGroup
                options={ARTICULATED_BY_OPTIONS}
                value={effectiveArticulatedBy}
                onChange={(value) => onChange('articulatedBy', value)}
              />
            </div>
            {errors?.articulatedBy && (
              <p className="text-sm text-danger font-medium">{errors.articulatedBy}</p>
            )}
          </div>
        </CollapsibleSubsection>
      </div>
    );
  }
);

SubmissionTypeSection.displayName = 'SubmissionTypeSection';
