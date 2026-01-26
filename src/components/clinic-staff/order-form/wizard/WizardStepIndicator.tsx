'use client';

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

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      {/* Step 1 */}
      <button
        type="button"
        onClick={() => handleStepClick(1)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg transition-all
          ${currentStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background/20 text-sm font-bold">
          1
        </span>
        <span className="font-medium">Situación Inicial</span>
      </button>

      {/* Connector */}
      <Icons.chevronRight className="h-5 w-5 text-muted-foreground" />

      {/* Step 2 */}
      <button
        type="button"
        onClick={() => handleStepClick(2)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg transition-all
          ${currentStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background/20 text-sm font-bold">
          2
        </span>
        <span className="font-medium">Asignar Trabajos</span>
      </button>
    </div>
  );
}
