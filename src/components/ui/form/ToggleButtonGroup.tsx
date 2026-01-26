'use client';

import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

export interface ToggleOption<T extends string = string> {
  value: T;
  label: string;
  icon?: keyof typeof Icons;
  disabled?: boolean;
}

interface ToggleButtonGroupProps<T extends string = string> {
  options: ToggleOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  disabled = false,
  className = '',
}: ToggleButtonGroupProps<T>) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {options.map((option) => {
        const IconComponent = option.icon ? Icons[option.icon] : null;
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <Button
            key={option.value}
            type="button"
            variant={isSelected ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => !isDisabled && onChange(option.value)}
            disabled={isDisabled}
          >
            {IconComponent && <IconComponent className="h-4 w-4 mr-1.5" />}
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
