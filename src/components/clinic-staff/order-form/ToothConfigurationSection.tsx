'use client';

import { ToothSelector } from './ToothSelector';
import { ToothActions } from './ToothActions';
import { ToothData } from '@/types/tooth';
import { copyToothData } from './orderFormUtils';
import { ValidationErrorDetail } from '@/types/validation';
import { Icons } from '@/components/ui/Icons';

interface ToothConfigurationSectionProps {
  teethNumbers: string[];
  selectedTooth: string | null;
  onToothSelect: (toothNumber: string) => void;
  teethData: Map<string, ToothData>;
  onTeethDataChange: (updater: (prev: Map<string, ToothData>) => Map<string, ToothData>) => void;
  teethWithErrors?: Set<string>;
  validationErrors?: Map<string, ValidationErrorDetail[]>;
}

export function ToothConfigurationSection({
  teethNumbers,
  selectedTooth,
  onToothSelect,
  teethData,
  onTeethDataChange,
  teethWithErrors = new Set(),
  validationErrors = new Map(),
}: ToothConfigurationSectionProps) {
  // Don't render if no teeth entered
  if (teethNumbers.length === 0) {
    return null;
  }

  // Determine which teeth have data configured
  const teethWithData = new Set(
    Array.from(teethData.entries())
      .filter(
        ([_, data]) =>
          data.material || data.tipoTrabajo || data.trabajoSobreImplante
      )
      .map(([toothNumber]) => toothNumber)
  );

  // Get errors for the currently selected tooth
  const selectedToothErrors: ValidationErrorDetail[] = [];
  if (selectedTooth) {
    validationErrors.forEach((errors) => {
      errors.forEach((error) => {
        if (error.toothNumber === selectedTooth) {
          selectedToothErrors.push(error);
        }
      });
    });
  }

  return (
    <div className="rounded-xl bg-background p-6 shadow-md border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Configuración por Diente</h2>
        {selectedTooth && (
          <ToothActions
            sourceTooth={selectedTooth}
            allTeeth={teethNumbers}
            onCopyToAll={() => {
              onTeethDataChange((prev) =>
                copyToothData(selectedTooth, teethNumbers, prev)
              );
            }}
            onCopyToSelected={(targets) => {
              onTeethDataChange((prev) => copyToothData(selectedTooth, targets, prev));
            }}
          />
        )}
      </div>
      <ToothSelector
        teethNumbers={teethNumbers}
        selectedTooth={selectedTooth}
        onToothSelect={onToothSelect}
        teethWithData={teethWithData}
        teethWithErrors={teethWithErrors}
      />

      {/* Display errors for selected tooth */}
      {selectedToothErrors.length > 0 && (
        <div className="mt-4 rounded-md bg-danger/10 p-4 border border-danger/20">
          <div className="flex items-start gap-2">
            <Icons.alertCircle className="h-5 w-5 text-danger mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-danger mb-2">
                Errores en diente {selectedTooth}
              </h3>
              <ul className="space-y-1">
                {selectedToothErrors.map((error, index) => (
                  <li key={index} className="text-sm text-danger/90">
                    • {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
