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
  onChange: (value: T | undefined) => void;
  disabled?: boolean;
  className?: string;
  /** If true, clicking the selected option will deselect it. Default: false */
  allowDeselect?: boolean;
}

export function ToggleButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  disabled = false,
  className = '',
  allowDeselect = false,
}: ToggleButtonGroupProps<T>) {
  const handleClick = (optionValue: T) => {
    if (allowDeselect && value === optionValue) {
      // Deselect if clicking the already-selected option
      onChange(undefined);
    } else {
      onChange(optionValue);
    }
  };

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
            onClick={() => !isDisabled && handleClick(option.value)}
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
