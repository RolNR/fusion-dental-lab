'use client';

import { forwardRef } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { CollapsibleSubsection } from '@/components/ui/form';

type AdditionalNotesSectionProps = {
  additionalNotes: string;
  onChange: (value: string) => void;
  errors?: {
    additionalNotes?: string;
  };
  disabled?: boolean;
  hasErrors?: boolean;
  errorCount?: number;
};

export const AdditionalNotesSection = forwardRef<HTMLDivElement, AdditionalNotesSectionProps>(
  ({ additionalNotes, onChange, errors, disabled = false }, ref) => {
    return (
      <div ref={ref}>
        <CollapsibleSubsection icon="fileText" title="Notas Adicionales">
          <Textarea
            id="notes"
            value={additionalNotes}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={4}
            placeholder="Agrega cualquier instrucción o detalle adicional que deba considerarse para este caso."
            error={errors?.additionalNotes}
          />
        </CollapsibleSubsection>
      </div>
    );
  }
);

AdditionalNotesSection.displayName = 'AdditionalNotesSection';
