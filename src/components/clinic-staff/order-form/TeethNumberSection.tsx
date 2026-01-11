'use client';

import { Input } from '@/components/ui/Input';
import {
  SectionContainer,
  SectionHeader,
} from '@/components/ui/form';

type TeethNumberSectionProps = {
  teethNumbers: string;
  onChange: (field: 'teethNumbers', value: string) => void;
  errors?: {
    teethNumbers?: string;
  };
  disabled?: boolean;
};

export function TeethNumberSection({
  teethNumbers,
  onChange,
  errors,
  disabled = false,
}: TeethNumberSectionProps) {
  return (
    <SectionContainer>
      <SectionHeader
        icon="user"
        title="Números de Dientes"
        description="Ingrese los números de los dientes"
        required
      />

      <div className="space-y-4 p-6">
         <Input
        label="Números de Dientes"
        type="text"
        value={teethNumbers || ''}
        onChange={(e) => onChange('teethNumbers', e.target.value)}
        disabled={disabled}
        placeholder="11, 12, 21, 22"
         error={errors?.teethNumbers}
      />
      </div>
    </SectionContainer>
  );
}