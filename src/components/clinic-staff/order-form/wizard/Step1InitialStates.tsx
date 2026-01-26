'use client';

import { useMemo, useState } from 'react';
import { Odontogram } from '../Odontogram';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Icons } from '@/components/ui/Icons';
import { InitialStateToolbar, InitialStateTool } from './InitialStateToolbar';
import { ImplantInfoList, ImplantData, areImplantsComplete } from './ImplantInfoList';
import {
  InitialToothStatesMap,
  countTeethWithState,
  getInitialStatesSummary,
  getTeethWithState,
} from '@/types/initial-tooth-state';
import { ToothConfigStatus } from '@/types/tooth';
import { ImplantInfo } from '@/types/order';

interface Step1InitialStatesProps {
  initialStates: InitialToothStatesMap;
  implantData: Map<string, ImplantData>;
  activeTool: InitialStateTool;
  onToolChange: (tool: InitialStateTool) => void;
  onInitialStateToggle: (toothNumber: string) => void;
  onImplantUpdate: (toothNumber: string, updates: Partial<ImplantInfo>) => void;
  onNext: () => void;
  disabled?: boolean;
}

export function Step1InitialStates({
  initialStates,
  implantData,
  activeTool,
  onToolChange,
  onInitialStateToggle,
  onImplantUpdate,
  onNext,
  disabled = false,
}: Step1InitialStatesProps) {
  const [skipImplantValidation, setSkipImplantValidation] = useState(false);

  const counts = useMemo(
    () => ({
      ausente: countTeethWithState(initialStates, 'AUSENTE'),
      pilar: countTeethWithState(initialStates, 'PILAR'),
      implante: countTeethWithState(initialStates, 'IMPLANTE'),
    }),
    [initialStates]
  );

  const summary = getInitialStatesSummary(initialStates);

  // Get implants list from initialStates and merge with implantData
  const implantsList = useMemo(() => {
    const implantTeeth = getTeethWithState(initialStates, 'IMPLANTE');
    return implantTeeth.map((toothNumber) => {
      const data = implantData.get(toothNumber);
      return {
        toothNumber,
        marcaImplante: data?.marcaImplante,
        sistemaConexion: data?.sistemaConexion,
      };
    });
  }, [initialStates, implantData]);

  // Check if implants are complete or user skipped validation
  const canProceed = useMemo(() => {
    if (implantsList.length === 0) return true;
    if (skipImplantValidation) return true;
    return areImplantsComplete(implantsList);
  }, [implantsList, skipImplantValidation]);

  // Empty config status map for step 1 (no work assigned yet)
  const emptyConfigStatus = useMemo(() => new Map<string, ToothConfigStatus>(), []);

  // Map InitialStateTool to ToothEditMode
  const editMode =
    activeTool === 'ausente'
      ? 'ausente'
      : activeTool === 'pilar'
        ? 'pilar'
        : activeTool === 'implante'
          ? 'implante'
          : 'selection';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Paso 1: Situación Inicial</h3>
        <p className="text-sm text-muted-foreground">
          Marca los dientes ausentes, pilares e implantes antes de asignar trabajos.
        </p>
      </div>

      {/* Toolbar */}
      <InitialStateToolbar
        activeTool={activeTool}
        onToolChange={onToolChange}
        counts={counts}
        disabled={disabled}
      />

      {/* Tool instruction hint */}
      {activeTool && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
          <Icons.info className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">
            {activeTool === 'ausente' &&
              'Haz clic en los dientes que faltan para marcarlos como ausentes.'}
            {activeTool === 'pilar' &&
              'Haz clic en los dientes pilares (dientes naturales que soportarán un puente).'}
            {activeTool === 'implante' &&
              'Haz clic en los dientes con implante. Se marcará automáticamente "trabajo sobre implante".'}
          </span>
        </div>
      )}

      {/* Odontogram */}
      <Odontogram
        teethInOrder={[]}
        selectedForConfig={[]}
        teethConfigStatus={emptyConfigStatus}
        teethWithErrors={new Set()}
        initialStates={initialStates}
        editMode={editMode as 'selection' | 'ausente' | 'pilar'}
        onInitialStateToggle={onInitialStateToggle}
        showInitialStatesLegend={true}
        readOnly={!activeTool}
      />

      {/* Summary */}
      {summary && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg">
          <Icons.check className="h-4 w-4 text-success" />
          <span className="text-sm text-foreground">
            <strong>Resumen:</strong> {summary}
          </span>
        </div>
      )}

      {/* Implant Information List */}
      {implantsList.length > 0 && (
        <div className="border-t border-border pt-6 space-y-4">
          <ImplantInfoList
            implants={implantsList}
            onImplantUpdate={onImplantUpdate}
            disabled={disabled}
          />

          {/* Skip validation checkbox */}
          <Checkbox
            checked={skipImplantValidation}
            onChange={(e) => setSkipImplantValidation(e.target.checked)}
            disabled={disabled}
            label="No cuento con la información completa del implante"
          />

          {/* Validation warning */}
          {!canProceed && (
            <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 rounded-lg">
              <Icons.alertCircle className="h-4 w-4 text-warning shrink-0" />
              <span className="text-sm text-warning">
                Completa la información de los implantes o marca la casilla anterior para continuar.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end">
        <Button type="button" variant="primary" onClick={onNext} disabled={disabled || !canProceed}>
          Siguiente
          <Icons.chevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
