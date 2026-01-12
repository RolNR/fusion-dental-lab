'use client';

import { Icons } from '@/components/ui/Icons';
import { SECTION_NAMES } from '@/types/validation';

interface ValidationErrorSummaryProps {
  errorsBySection: Map<string, any[]>;
  onSectionClick: (sectionId: string) => void;
  onDismiss: () => void;
}

export function ValidationErrorSummary({
  errorsBySection,
  onSectionClick,
  onDismiss,
}: ValidationErrorSummaryProps) {
  const totalErrors = Array.from(errorsBySection.values()).reduce(
    (sum, errors) => sum + errors.length,
    0
  );

  if (totalErrors === 0) return null;

  return (
    <div className="rounded-lg border-2 border-danger bg-danger/10 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Icons.alertCircle className="h-5 w-5 text-danger flex-shrink-0" />
            <h3 className="text-lg font-semibold text-danger">
              {totalErrors === 1
                ? 'Hay 1 error que debes corregir'
                : `Hay ${totalErrors} errores que debes corregir`}
            </h3>
          </div>

          <ul className="space-y-2">
            {Array.from(errorsBySection.entries()).map(([sectionId, errors]) => (
              <li key={sectionId}>
                <button
                  type="button"
                  onClick={() => onSectionClick(sectionId)}
                  className="text-sm text-foreground hover:text-primary hover:underline text-left transition-colors flex items-center gap-2"
                >
                  <span className="font-medium">{SECTION_NAMES[sectionId] || sectionId}:</span>
                  <span className="text-danger">
                    {errors.length === 1 ? '1 error' : `${errors.length} errores`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-danger/20 transition-colors flex-shrink-0"
          aria-label="Cerrar"
        >
          <Icons.x className="h-4 w-4 text-danger" />
        </button>
      </div>
    </div>
  );
}
