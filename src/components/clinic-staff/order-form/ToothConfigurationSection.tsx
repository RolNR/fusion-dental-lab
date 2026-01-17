'use client';

import { ToothSelector } from './ToothSelector';
import { ToothActions } from './ToothActions';
import { ToothData } from '@/types/tooth';
import { copyToothData } from './orderFormUtils';

interface ToothConfigurationSectionProps {
  teethNumbers: string[];
  selectedTooth: string | null;
  onToothSelect: (toothNumber: string) => void;
  teethData: Map<string, ToothData>;
  onTeethDataChange: (updater: (prev: Map<string, ToothData>) => Map<string, ToothData>) => void;
}

export function ToothConfigurationSection({
  teethNumbers,
  selectedTooth,
  onToothSelect,
  teethData,
  onTeethDataChange,
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
        teethWithErrors={new Set()}
      />
    </div>
  );
}
