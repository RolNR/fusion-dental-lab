'use client';

import { forwardRef } from 'react';
import { Input } from '@/components/ui/Input';
import { SectionContainer, SectionHeader } from '@/components/ui/form';

type TeethNumberSectionProps = {
  teethNumbers: string;
  onChange: (field: 'teethNumbers', value: string) => void;
  errors?: {
    teethNumbers?: string;
  };
  disabled?: boolean;
  hasErrors?: boolean;
  errorCount?: number;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
};

export const TeethNumberSection = forwardRef<HTMLDivElement, TeethNumberSectionProps>(
  (
    {
      teethNumbers,
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
);

TeethNumberSection.displayName = 'TeethNumberSection';
