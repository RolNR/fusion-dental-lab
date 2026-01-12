'use client';

import { Textarea } from '@/components/ui/Textarea';
import { SectionContainer, SectionHeader } from '@/components/ui/form';

type DescriptionSectionProps = {
  description: string;
  onChange: (value: string) => void;
  errors?: {
    description?: string;
  };
  disabled?: boolean;
};

export function DescriptionSection({
  description,
  onChange,
  errors,
  disabled = false,
}: DescriptionSectionProps) {
  return (
    <SectionContainer>
      <SectionHeader
        icon="fileText"
        title="Descripción del Trabajo"
        description="Detalles específicos y observaciones del caso"
      />

      <div className="p-6">
        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder="Describe el trabajo dental, materiales específicos, consideraciones especiales, etc."
          error={errors?.description}
        />
      </div>
    </SectionContainer>
  );
}
