'use client';

import { useState, useMemo, useCallback } from 'react';
import { Odontogram } from './Odontogram';
import { ToothData } from '@/types/tooth';
import { ValidationErrorDetail } from '@/types/validation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { WorkTypeSection } from './WorkTypeSection';
import { MaterialAndColorSection } from './MaterialAndColorSection';
import { ImplantSection } from './ImplantSection';
import { RestorationType } from '@prisma/client';
import { ColorInfo, ImplantInfo } from '@/types/order';
import {
  InitialToothStatesMap,
  ToothInitialState,
  getToothInitialState,
  countTeethWithState,
} from '@/types/initial-tooth-state';
import type { ToothEditMode } from './Tooth';

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
  initialToothStates?: InitialToothStatesMap;
  onInitialStatesChange?: (states: InitialToothStatesMap) => void;
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
  initialToothStates = {},
  onInitialStatesChange,
}: ToothConfigurationSectionProps) {
  // Edit mode for initial states
  const [editMode, setEditMode] = useState<ToothEditMode>('selection');

  // Determine which teeth have data configured
  const teethWithData = useMemo(
    () =>
      new Set(
        Array.from(teethData.entries())
          .filter(
            ([_, data]) => data.material || data.tipoRestauracion || data.trabajoSobreImplante
          )
          .map(([toothNumber]) => toothNumber)
      ),
    [teethData]
  );

  // Get errors for all selected teeth
  const allSelectedTeethErrors = useMemo(() => {
    const errors: ValidationErrorDetail[] = [];
    teethNumbers.forEach((toothNumber) => {
      validationErrors.forEach((errList) => {
        errList.forEach((error) => {
          if (error.toothNumber === toothNumber) {
            errors.push(error);
          }
        });
      });
    });
    return errors;
  }, [teethNumbers, validationErrors]);

  // Get common values across all selected teeth (for displaying in form fields)
  const commonValues = useMemo(() => {
    const getCommonValue = <T,>(getter: (tooth: ToothData) => T | undefined): T | undefined => {
      if (teethNumbers.length === 0) return undefined;
      const values = teethNumbers.map((num) => {
        const data = teethData.get(num);
        return data ? getter(data) : undefined;
      });
      const firstValue = values[0];
      const allSame = values.every((v) => JSON.stringify(v) === JSON.stringify(firstValue));
      return allSame ? firstValue : undefined;
    };

    return {
      material: getCommonValue((t) => t.material),
      tipoRestauracion: getCommonValue((t) => t.tipoRestauracion),
      colorInfo: getCommonValue((t) => t.colorInfo),
      trabajoSobreImplante: getCommonValue((t) => t.trabajoSobreImplante),
      informacionImplante: getCommonValue((t) => t.informacionImplante),
    };
  }, [teethNumbers, teethData]);

  // Helper to update ALL selected teeth data
  const updateAllTeethData = useCallback(
    (updates: Partial<ToothData>) => {
      if (teethNumbers.length === 0) return;
      onTeethDataChange((prev) => {
        const updated = new Map(prev);
        teethNumbers.forEach((toothNumber) => {
          const currentData = updated.get(toothNumber) || { toothNumber };
          updated.set(toothNumber, { ...currentData, ...updates });
        });
        return updated;
      });
    },
    [teethNumbers, onTeethDataChange]
  );

  // Handler for work type changes - applies to ALL selected teeth
  const handleWorkTypeChange = useCallback(
    (updates: { tipoRestauracion?: RestorationType }) => {
      updateAllTeethData(updates);
    },
    [updateAllTeethData]
  );

  // Handler for material changes - applies to ALL selected teeth
  const handleMaterialChange = useCallback(
    (value: string) => {
      updateAllTeethData({ material: value });
    },
    [updateAllTeethData]
  );

  // Handler for color info changes - applies to ALL selected teeth
  const handleColorInfoChange = useCallback(
    (value: ColorInfo | undefined) => {
      updateAllTeethData({ colorInfo: value });
    },
    [updateAllTeethData]
  );

  // Handler for implant changes - applies to ALL selected teeth
  const handleImplantChange = useCallback(
    (updates: { trabajoSobreImplante?: boolean; informacionImplante?: ImplantInfo }) => {
      updateAllTeethData(updates);
    },
    [updateAllTeethData]
  );

  // Handler for toggling initial tooth states (AUSENTE/PILAR)
  const handleInitialStateToggle = useCallback(
    (toothNumber: string) => {
      if (!onInitialStatesChange) return;

      const currentState = getToothInitialState(initialToothStates, toothNumber);
      const newStates = { ...initialToothStates };

      if (editMode === 'ausente') {
        if (currentState === 'AUSENTE') {
          delete newStates[toothNumber];
        } else {
          newStates[toothNumber] = 'AUSENTE' as ToothInitialState;
        }
      } else if (editMode === 'pilar') {
        if (currentState === 'PILAR') {
          delete newStates[toothNumber];
        } else {
          newStates[toothNumber] = 'PILAR' as ToothInitialState;
        }
      }

      onInitialStatesChange(newStates);
    },
    [editMode, initialToothStates, onInitialStatesChange]
  );

  // Count teeth with special states
  const ausenteCount = countTeethWithState(initialToothStates, 'AUSENTE');
  const pilarCount = countTeethWithState(initialToothStates, 'PILAR');

  return (
    <div className="rounded-xl bg-background p-6 shadow-md border border-border">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Configuración de Dientes</h2>
        </div>

        {/* Mode toggle buttons for initial states */}
        {onInitialStatesChange && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Modo:</span>
            <Button
              type="button"
              variant={editMode === 'selection' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setEditMode('selection')}
              disabled={disabled}
            >
              <Icons.pointer className="h-4 w-4 mr-1.5" />
              Selección
            </Button>
            <Button
              type="button"
              variant={editMode === 'ausente' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setEditMode(editMode === 'ausente' ? 'selection' : 'ausente')}
              disabled={disabled}
            >
              <Icons.ghost className="h-4 w-4 mr-1.5" />
              Marcar Ausentes
              {ausenteCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                  {ausenteCount}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant={editMode === 'pilar' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setEditMode(editMode === 'pilar' ? 'selection' : 'pilar')}
              disabled={disabled}
            >
              <Icons.screw className="h-4 w-4 mr-1.5" />
              Marcar Pilares
              {pilarCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                  {pilarCount}
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Mode instruction hint */}
        {editMode !== 'selection' && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            {editMode === 'ausente' && (
              <>
                <Icons.info className="h-4 w-4 inline mr-1.5" />
                Haz clic en los dientes para marcarlos como <strong>ausentes</strong>. Los dientes
                ausentes no podrán ser seleccionados para trabajo.
              </>
            )}
            {editMode === 'pilar' && (
              <>
                <Icons.info className="h-4 w-4 inline mr-1.5" />
                Haz clic en los dientes para marcarlos como <strong>pilares de implante</strong>. Al
                seleccionarlos para trabajo, se marcará automáticamente "trabajo sobre implante".
              </>
            )}
          </div>
        )}
      </div>

      {/* Odontogram */}
      <Odontogram
        selectedTeeth={teethNumbers}
        currentTooth={editMode === 'selection' ? null : selectedTooth}
        teethWithData={teethWithData}
        teethWithErrors={teethWithErrors}
        onToothToggle={onToothToggle}
        onToothSelect={onToothSelect}
        initialStates={initialToothStates}
        showInitialStatesLegend={true}
        editMode={editMode}
        onInitialStateToggle={handleInitialStateToggle}
      />

      {/* Display errors for selected teeth */}
      {allSelectedTeethErrors.length > 0 && (
        <div className="mt-4 rounded-md bg-danger/10 p-4 border border-danger/20">
          <div className="flex items-start gap-2">
            <Icons.alertCircle className="h-5 w-5 text-danger mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-danger mb-2">
                Errores en dientes seleccionados
              </h3>
              <ul className="space-y-1">
                {allSelectedTeethErrors.map((error, index) => (
                  <li key={index} className="text-sm text-danger/90">
                    • Diente {error.toothNumber}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Configuration sections - shown when teeth are selected */}
      {teethNumbers.length > 0 && editMode === 'selection' && (
        <div className="mt-6 space-y-4 border-t border-border pt-6">
          {/* Selected teeth indicator */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {teethNumbers.map((num) => (
                <div
                  key={num}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm"
                >
                  {num}
                </div>
              ))}
            </div>
            <h3 className="text-lg font-semibold text-foreground ml-2">
              {teethNumbers.length === 1
                ? `Configuración del Diente ${teethNumbers[0]}`
                : `Configuración de ${teethNumbers.length} Dientes`}
            </h3>
          </div>

          {teethNumbers.length > 1 && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              <Icons.info className="h-4 w-4 inline mr-1.5" />
              Los cambios se aplicarán a todos los dientes seleccionados.
            </p>
          )}

          {/* Work Type Section */}
          <WorkTypeSection
            tipoRestauracion={commonValues.tipoRestauracion ?? undefined}
            onChange={handleWorkTypeChange}
          />

          {/* Material and Color Section */}
          <MaterialAndColorSection
            material={commonValues.material ?? ''}
            colorInfo={commonValues.colorInfo ?? undefined}
            onMaterialChange={handleMaterialChange}
            onColorInfoChange={handleColorInfoChange}
            disabled={disabled}
          />

          {/* Implant Section */}
          <ImplantSection
            trabajoSobreImplante={commonValues.trabajoSobreImplante}
            informacionImplante={commonValues.informacionImplante ?? undefined}
            onChange={handleImplantChange}
          />
        </div>
      )}
    </div>
  );
}
