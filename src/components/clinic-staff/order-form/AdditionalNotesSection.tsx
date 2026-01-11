'use client';

import { Textarea } from '@/components/ui/Textarea';
import {
  SectionContainer,
  SectionHeader,
} from '@/components/ui/form';

type AdditionalNotesSectionProps = {
  additionalNotes: string;
  onChange: (value: string) => void;
  errors?: {
    additionalNotes?: string;
  };
  disabled?: boolean;
};

export function AdditionalNotesSection({
  additionalNotes,
  onChange,
  errors,
  disabled = false,
}: AdditionalNotesSectionProps) {
  return (
    <SectionContainer>
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
