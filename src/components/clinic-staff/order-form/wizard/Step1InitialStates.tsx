'use client';

import { useMemo } from 'react';
import { Odontogram } from '../Odontogram';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { InitialStateToolbar, InitialStateTool } from './InitialStateToolbar';
import {
  InitialToothStatesMap,
  countTeethWithState,
  getInitialStatesSummary,
} from '@/types/initial-tooth-state';
import { ToothConfigStatus } from '@/types/tooth';

interface Step1InitialStatesProps {
  initialStates: InitialToothStatesMap;
  activeTool: InitialStateTool;
  onToolChange: (tool: InitialStateTool) => void;
  onInitialStateToggle: (toothNumber: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

export function Step1InitialStates({
  initialStates,
  activeTool,
  onToolChange,
  onInitialStateToggle,
  onNext,
  disabled = false,
}: Step1InitialStatesProps) {
  const counts = useMemo(
    () => ({
      ausente: countTeethWithState(initialStates, 'AUSENTE'),
      pilar: countTeethWithState(initialStates, 'PILAR'),
      implante: countTeethWithState(initialStates, 'IMPLANTE'),
    }),
    [initialStates]
  );

  const summary = getInitialStatesSummary(initialStates);

  // Empty config status map for step 1 (no work assigned yet)
  const emptyConfigStatus = useMemo(() => new Map<string, ToothConfigStatus>(), []);

  // Map InitialStateTool to ToothEditMode
  const editMode = activeTool === 'ausente' ? 'ausente' : activeTool === 'pilar' ? 'pilar' : activeTool === 'implante' ? 'implante' : 'selection';

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
            {activeTool === 'ausente' && 'Haz clic en los dientes que faltan para marcarlos como ausentes.'}
            {activeTool === 'pilar' && 'Haz clic en los dientes pilares (dientes naturales que soportarán un puente).'}
            {activeTool === 'implante' && 'Haz clic en los dientes con implante. Se marcará automáticamente "trabajo sobre implante".'}
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

      {/* Next Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={disabled}
        >
          Siguiente
          <Icons.chevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
