'use client';

import { forwardRef } from 'react';
import { SubmissionType, ArticulatedBy } from '@prisma/client';
import { SectionContainer, SectionHeader, ButtonCard, FieldLabel } from '@/components/ui/form';

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
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
};

export const SubmissionTypeSection = forwardRef<HTMLDivElement, SubmissionTypeSectionProps>(
  (
    {
      submissionType,
      articulatedBy,
      onChange,
      errors,
      hasErrors,
      errorCount,
      collapsed,
      onCollapseChange,
    },
    ref
  ) => {
    const submissionTypes = [
      {
        value: 'prueba_estructura',
        label: 'Prueba de Estructura',
        subtitle: 'Verificación estructural',
        icon: 'layers' as const,
      },
      {
        value: 'prueba_estetica',
        label: 'Prueba Estética',
        subtitle: 'Verificación estética',
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

    return (
      <SectionContainer
        ref={ref}
        hasErrors={hasErrors}
        errorCount={errorCount}
        collapsed={collapsed}
        onCollapseChange={onCollapseChange}
      >
        <SectionHeader
          icon="upload"
          title="Tipo de Entrega y Articulación"
          description="Especifica cómo se entregará el trabajo"
          required
        />

        <div className="space-y-6 p-6">
          {/* Submission Type */}
          <div>
            <FieldLabel label="Tipo de Entrega" required />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {submissionTypes.map((type) => (
                <ButtonCard
                  key={type.value}
                  icon={type.icon}
                  title={type.label}
                  subtitle={type.subtitle}
                  selected={
                    submissionType === type.value || (!submissionType && type.value === 'terminado')
                  }
                  onClick={() => onChange('submissionType', type.value)}
                />
              ))}
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
                    articulatedBy === option.value || (!articulatedBy && option.value === 'doctor')
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
      </SectionContainer>
    );
  }
);

SubmissionTypeSection.displayName = 'SubmissionTypeSection';
