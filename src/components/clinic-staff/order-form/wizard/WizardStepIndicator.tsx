'use client';

import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface WizardStepIndicatorProps {
  currentStep: 1 | 2;
  onStepClick?: (step: 1 | 2) => void;
  disabled?: boolean;
}

export function WizardStepIndicator({
  currentStep,
  onStepClick,
  disabled = false,
}: WizardStepIndicatorProps) {
  const handleStepClick = (step: 1 | 2) => {
    if (!disabled && onStepClick) {
      onStepClick(step);
    }
  };

  const getStepClassName = (step: 1 | 2) => {
    const isActive = currentStep === step;
    return isActive
      ? '' // Use default primary styling
      : '!bg-muted !text-muted-foreground hover:!bg-muted/80 !shadow-none';
  };

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      {/* Step 1 */}
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => handleStepClick(1)}
        disabled={disabled}
        className={getStepClassName(1)}
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background/20 text-sm font-bold mr-2">
          1
        </span>
        <span className="font-medium">Situación Inicial</span>
      </Button>

      {/* Connector */}
      <Icons.chevronRight className="h-5 w-5 text-muted-foreground" />

      {/* Step 2 */}
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => handleStepClick(2)}
        disabled={disabled}
        className={getStepClassName(2)}
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background/20 text-sm font-bold mr-2">
          2
        </span>
        <span className="font-medium">Asignar Trabajos</span>
      </Button>
    </div>
  );
}
