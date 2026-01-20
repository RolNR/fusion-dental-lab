'use client';

import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { SECTION_NAMES, ValidationErrorDetail } from '@/types/validation';

interface ValidationErrorSummaryProps {
  errorsBySection: Map<string, ValidationErrorDetail[]>;
  onSectionClick: (sectionId: string) => void;
  onToothClick?: (toothNumber: string) => void;
  onDismiss: () => void;
}

export function ValidationErrorSummary({
  errorsBySection,
  onSectionClick,
  onToothClick,
  onDismiss,
}: ValidationErrorSummaryProps) {
  const totalErrors = Array.from(errorsBySection.values()).reduce(
    (sum, errors) => sum + errors.length,
    0
  );

  if (totalErrors === 0) return null;

  // Group errors by tooth number for tooth-specific errors
  const groupErrorsByTooth = (errors: ValidationErrorDetail[]) => {
    const byTooth = new Map<string, ValidationErrorDetail[]>();
    const nonToothErrors: ValidationErrorDetail[] = [];

    errors.forEach((error) => {
      if (error.toothNumber) {
        if (!byTooth.has(error.toothNumber)) {
          byTooth.set(error.toothNumber, []);
        }
        byTooth.get(error.toothNumber)!.push(error);
      } else {
        nonToothErrors.push(error);
      }
    });

    return { byTooth, nonToothErrors };
  };

  // Get all unique teeth with errors across all sections
  const allTeethWithErrors = new Set<string>();
  Array.from(errorsBySection.values()).forEach((errors) => {
    errors.forEach((error) => {
      if (error.toothNumber) {
        allTeethWithErrors.add(error.toothNumber);
      }
    });
  });

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

          {/* Show summary of teeth with errors */}
          {allTeethWithErrors.size > 0 && (
            <div className="mb-4 p-3 rounded-md bg-danger/5 border border-danger/20">
              <p className="text-sm font-medium text-danger mb-2">
                Dientes con información incompleta ({allTeethWithErrors.size}):
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(allTeethWithErrors)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((tooth) => (
                    <Button
                      key={tooth}
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        onToothClick?.(tooth);
                      }}
                      className="!px-2 !py-1 !text-xs !shadow-none"
                      title={`Click para ir al diente ${tooth}`}
                    >
                      {tooth}
                    </Button>
                  ))}
              </div>
              <p className="text-xs text-danger/70 mt-2">
                Haz clic en un diente para ver los errores específicos
              </p>
            </div>
          )}

          <ul className="space-y-3">
            {Array.from(errorsBySection.entries()).map(([sectionId, errors]) => {
              const { byTooth, nonToothErrors } = groupErrorsByTooth(errors);
              const hasToothErrors = byTooth.size > 0;

              return (
                <li key={sectionId} className="space-y-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSectionClick(sectionId)}
                    className="!px-0 !py-0 !text-sm !font-medium hover:!bg-transparent hover:underline text-left !shadow-none"
                  >
                    <span>{SECTION_NAMES[sectionId] || sectionId}:</span>
                    <span className="text-danger ml-2">
                      {errors.length === 1 ? '1 error' : `${errors.length} errores`}
                    </span>
                  </Button>

                  {/* Show tooth-specific errors */}
                  {hasToothErrors && (
                    <div className="ml-4 space-y-1">
                      {Array.from(byTooth.entries())
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([toothNumber, toothErrors]) => (
                          <div key={toothNumber} className="text-xs text-danger/90">
                            <span className="font-semibold">Diente {toothNumber}:</span>
                            <ul className="ml-4 mt-0.5 space-y-0.5">
                              {toothErrors.map((error, idx) => (
                                <li key={idx}>• {error.message}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Show non-tooth-specific errors */}
                  {nonToothErrors.length > 0 && (
                    <div className="ml-4 space-y-0.5">
                      {nonToothErrors.map((error, idx) => (
                        <div key={idx} className="text-xs text-danger/90">
                          • {error.message}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="!h-6 !w-6 !p-0 !rounded hover:!bg-danger/20 !shadow-none flex-shrink-0"
          aria-label="Cerrar"
        >
          <Icons.x className="h-4 w-4 text-danger" />
        </Button>
      </div>
    </div>
  );
}
