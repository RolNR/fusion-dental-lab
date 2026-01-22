'use client';

import { Odontogram } from './Odontogram';
import { ToothActions } from './ToothActions';
import { ToothData } from '@/types/tooth';
import { copyToothData } from './orderFormUtils';
import { ValidationErrorDetail } from '@/types/validation';
import { Icons } from '@/components/ui/Icons';
import { WorkTypeSection } from './WorkTypeSection';
import { MaterialAndColorSection } from './MaterialAndColorSection';
import { ImplantSection } from './ImplantSection';
import { WorkType, RestorationType } from '@prisma/client';
import { ColorInfo, ImplantInfo } from '@/types/order';

interface ToothConfigurationSectionProps {
  teethNumbers: string[];
  selectedTooth: string | null;
  onToothSelect: (toothNumber: string) => void;
  onToothToggle: (toothNumber: string) => void;
  teethData: Map<string, ToothData>;
  onTeethDataChange: (updater: (prev: Map<string, ToothData>) => Map<string, ToothData>) => void;
  teethWithErrors?: Set<string>;
  validationErrors?: Map<string, ValidationErrorDetail[]>;
  disabled?: boolean;
}

export function ToothConfigurationSection({
  teethNumbers,
  selectedTooth,
  onToothSelect,
  onToothToggle,
  teethData,
  onTeethDataChange,
  teethWithErrors = new Set(),
  validationErrors = new Map(),
  disabled = false,
}: ToothConfigurationSectionProps) {
  // Get current tooth data
  const currentToothData = selectedTooth ? teethData.get(selectedTooth) : undefined;

  // Determine which teeth have data configured
  const teethWithData = new Set(
    Array.from(teethData.entries())
      .filter(([_, data]) => data.material || data.tipoTrabajo || data.trabajoSobreImplante)
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

  // Helper to update tooth data
  const updateToothData = (updates: Partial<ToothData>) => {
    if (!selectedTooth) return;
    onTeethDataChange((prev) => {
      const updated = new Map(prev);
      const currentData = updated.get(selectedTooth) || { toothNumber: selectedTooth };
      updated.set(selectedTooth, { ...currentData, ...updates });
      return updated;
    });
  };

  // Handler for work type changes
  const handleWorkTypeChange = (updates: {
    tipoTrabajo?: WorkType;
    tipoRestauracion?: RestorationType;
  }) => {
    updateToothData(updates);
  };

  // Handler for material changes
  const handleMaterialChange = (field: 'material' | 'materialBrand', value: string) => {
    updateToothData({ [field]: value });
  };

  // Handler for color info changes
  const handleColorInfoChange = (value: ColorInfo | undefined) => {
    updateToothData({ colorInfo: value });
  };

  // Handler for implant changes
  const handleImplantChange = (updates: {
    trabajoSobreImplante?: boolean;
    informacionImplante?: ImplantInfo;
  }) => {
    updateToothData(updates);
  };

  return (
    <div className="rounded-xl bg-background p-6 shadow-md border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Configuración por Diente</h2>
        {selectedTooth && (
          <ToothActions
            sourceTooth={selectedTooth}
            allTeeth={teethNumbers}
            onCopyToAll={() => {
              onTeethDataChange((prev) => copyToothData(selectedTooth, teethNumbers, prev));
            }}
            onCopyToSelected={(targets) => {
              onTeethDataChange((prev) => copyToothData(selectedTooth, targets, prev));
            }}
          />
        )}
      </div>

      {/* Odontogram */}
      <Odontogram
        selectedTeeth={teethNumbers}
        currentTooth={selectedTooth}
        teethWithData={teethWithData}
        teethWithErrors={teethWithErrors}
        onToothToggle={onToothToggle}
        onToothSelect={onToothSelect}
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

      {/* Per-tooth configuration sections - shown when a tooth is selected */}
      {selectedTooth && (
        <div className="mt-6 space-y-4 border-t border-border pt-6">
          {/* Selected tooth indicator */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
              {selectedTooth}
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Configuración del Diente {selectedTooth}
            </h3>
          </div>

          {/* Work Type Section */}
          <WorkTypeSection
            tipoTrabajo={currentToothData?.tipoTrabajo ?? undefined}
            tipoRestauracion={currentToothData?.tipoRestauracion ?? undefined}
            onChange={handleWorkTypeChange}
          />

          {/* Material and Color Section */}
          <MaterialAndColorSection
            material={currentToothData?.material ?? ''}
            materialBrand={currentToothData?.materialBrand ?? ''}
            colorInfo={currentToothData?.colorInfo ?? undefined}
            onMaterialChange={handleMaterialChange}
            onColorInfoChange={handleColorInfoChange}
            disabled={disabled}
          />

          {/* Implant Section */}
          <ImplantSection
            trabajoSobreImplante={currentToothData?.trabajoSobreImplante}
            informacionImplante={currentToothData?.informacionImplante ?? undefined}
            onChange={handleImplantChange}
          />
        </div>
      )}
    </div>
  );
}
