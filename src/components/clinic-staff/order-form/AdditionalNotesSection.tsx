'use client';

import { forwardRef } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { SectionContainer, SectionHeader } from '@/components/ui/form';

type AdditionalNotesSectionProps = {
  additionalNotes: string;
  onChange: (value: string) => void;
  errors?: {
    additionalNotes?: string;
  };
  disabled?: boolean;
  hasErrors?: boolean;
  errorCount?: number;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
};

export const AdditionalNotesSection = forwardRef<HTMLDivElement, AdditionalNotesSectionProps>(
  (
    {
      additionalNotes,
      onChange,
      errors,
      disabled = false,
      hasErrors,
      errorCount,
      collapsed,
      onCollapseChange,
    },
    ref
  ) => {
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
        title="Notas Adicionales"
        description="Información extra que es relevante para el caso"
      />

      <div className="p-6">
        <Textarea
          id="notes"
          value={additionalNotes}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder="Agrega cualquier instrucción o detalle adicional que deba considerarse para este caso."
          error={errors?.additionalNotes}
        />
      </div>
    </SectionContainer>
  );
  }
);

AdditionalNotesSection.displayName = 'AdditionalNotesSection';
