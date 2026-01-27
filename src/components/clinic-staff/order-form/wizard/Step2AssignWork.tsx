'use client';

import { useMemo, useCallback, useRef } from 'react';
import { RestorationType } from '@prisma/client';
import { Odontogram } from '../Odontogram';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { GuidedTooltip } from '@/components/ui/GuidedTooltip';
import { WorkTypeToolbar } from './WorkTypeToolbar';
import { AssignedWorkList } from './AssignedWorkList';
import { TooltipState } from '@/hooks/useGuidedTooltips';
import {
  ToothData,
  BridgeDefinition,
  ToothConfigStatus,
  getToothConfigStatus,
} from '@/types/tooth';
import { InitialToothStatesMap, getToothInitialState } from '@/types/initial-tooth-state';

interface Step2AssignWorkProps {
  initialStates: InitialToothStatesMap;
  teethData: Map<string, ToothData>;
  bridges: BridgeDefinition[];
  activeTool: RestorationType | null;
  bridgeStart: string | null;
  onToolChange: (tool: RestorationType | null) => void;
  onToothClick: (toothNumber: string) => void;
  onToothUpdate: (toothNumber: string, updates: Partial<ToothData>) => void;
  onToothRemove: (toothNumber: string) => void;
  onBridgeUpdate: (bridgeId: string, updates: Partial<BridgeDefinition>) => void;
  onBridgeRemove: (bridgeId: string) => void;
  onBack: () => void;
  disabled?: boolean;
  // Tooltip props
  shouldShowTooltip: (key: keyof TooltipState) => boolean;
  dismissTooltip: (key: keyof TooltipState) => void;
  dismissedTooltips: TooltipState;
}

export function Step2AssignWork({
  initialStates,
  teethData,
  bridges,
  activeTool,
  bridgeStart,
  onToolChange,
  onToothClick,
  onToothUpdate,
  onToothRemove,
  onBridgeUpdate,
  onBridgeRemove,
  onBack,
  disabled = false,
  shouldShowTooltip,
  dismissTooltip,
  dismissedTooltips,
}: Step2AssignWorkProps) {
  // Refs for tooltip targets
  const toolbarRef = useRef<HTMLDivElement>(null);
  const odontogramRef = useRef<HTMLDivElement>(null);
  const workListRef = useRef<HTMLDivElement>(null);

  // Compute teeth in order (teeth with work assigned)
  const teethInOrder = useMemo(() => {
    const teeth: string[] = [];
    for (const [toothNumber, data] of teethData) {
      if (data.tipoRestauracion) {
        teeth.push(toothNumber);
      }
    }
    // Also add bridge teeth
    bridges.forEach((bridge) => {
      if (!teeth.includes(bridge.startTooth)) teeth.push(bridge.startTooth);
      if (!teeth.includes(bridge.endTooth)) teeth.push(bridge.endTooth);
      bridge.pontics.forEach((p) => {
        if (!teeth.includes(p)) teeth.push(p);
      });
    });
    return teeth.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [teethData, bridges]);

  // Compute config status for teeth
  const teethConfigStatus = useMemo(() => {
    const statusMap = new Map<string, ToothConfigStatus>();
    for (const [toothNumber, data] of teethData) {
      statusMap.set(toothNumber, getToothConfigStatus(data));
    }
    return statusMap;
  }, [teethData]);

  // Determine bridge instruction
  const bridgeInstruction = useMemo(() => {
    if (activeTool !== 'puente') return undefined;
    if (!bridgeStart) return 'Haz clic en el primer diente del puente';
    return `Primer diente: #${bridgeStart}. Ahora haz clic en el último diente del puente.`;
  }, [activeTool, bridgeStart]);

  // Handle tooth toggle - wraps onToothClick for the Odontogram
  const handleToothToggle = useCallback(
    (toothNumber: string) => {
      // Check if tooth is AUSENTE - cannot assign work directly to missing teeth
      // But they can be part of a bridge (as pontics)
      const state = getToothInitialState(initialStates, toothNumber);
      if (state === 'AUSENTE' && activeTool !== 'puente') {
        return; // Can't assign work to missing teeth (except in bridge mode)
      }

      onToothClick(toothNumber);
    },
    [initialStates, activeTool, onToothClick]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Paso 2: Asignar Trabajos</h3>
        <p className="text-sm text-muted-foreground">
          Selecciona un tipo de trabajo y haz clic en los dientes para asignarlo.
        </p>
      </div>

      {/* Toolbar */}
      <div ref={toolbarRef}>
        <WorkTypeToolbar
          activeTool={activeTool}
          onToolChange={onToolChange}
          bridgeMode={activeTool === 'puente'}
          bridgeInstruction={bridgeInstruction}
          disabled={disabled}
        />
      </div>

      {/* Work type tooltip */}
      <GuidedTooltip
        targetRef={toolbarRef}
        message="Primero selecciona el tipo de trabajo que deseas asignar"
        position="bottom"
        isVisible={shouldShowTooltip('step2WorkType')}
        onDismiss={() => dismissTooltip('step2WorkType')}
      />

      {/* Tool instruction hint for non-bridge tools */}
      {activeTool && activeTool !== 'puente' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
          <Icons.info className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">
            Haz clic en los dientes para asignar <strong>{activeTool}</strong>. Haz clic de nuevo
            para quitar la asignación.
          </span>
        </div>
      )}

      {/* Odontogram */}
      <div ref={odontogramRef}>
        <Odontogram
          teethInOrder={teethInOrder}
          selectedForConfig={bridgeStart ? [bridgeStart] : []}
          teethConfigStatus={teethConfigStatus}
          teethWithErrors={new Set()}
          initialStates={initialStates}
          editMode="selection"
          onToothToggle={handleToothToggle}
          onToothRemove={onToothRemove}
          showInitialStatesLegend={true}
          readOnly={!activeTool}
        />
      </div>

      {/* Select teeth tooltip - show when work type selected and previous tooltip dismissed */}
      <GuidedTooltip
        targetRef={odontogramRef}
        message="Ahora haz clic en los dientes para asignar el trabajo seleccionado"
        position="top"
        isVisible={
          activeTool !== null &&
          dismissedTooltips.step2WorkType &&
          shouldShowTooltip('step2SelectTeeth')
        }
        onDismiss={() => dismissTooltip('step2SelectTeeth')}
      />

      {/* Assigned Work List */}
      <div className="border-t border-border pt-6">
        <div ref={workListRef}>
          <AssignedWorkList
            teethData={teethData}
            bridges={bridges}
            initialStates={initialStates}
            onToothUpdate={onToothUpdate}
            onToothRemove={onToothRemove}
            onBridgeUpdate={onBridgeUpdate}
            onBridgeRemove={onBridgeRemove}
            disabled={disabled}
          />
        </div>

        {/* Fill details tooltip - show when teeth assigned and previous tooltip dismissed */}
        <GuidedTooltip
          targetRef={workListRef}
          message="Completa el material y color de cada pieza para finalizar"
          position="top"
          isVisible={
            teethInOrder.length > 0 &&
            dismissedTooltips.step2SelectTeeth &&
            shouldShowTooltip('step2FillDetails')
          }
          onDismiss={() => dismissTooltip('step2FillDetails')}
        />
      </div>

      {/* Back Button */}
      <div className="flex justify-start">
        <Button type="button" variant="secondary" onClick={onBack} disabled={disabled}>
          <Icons.chevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
      </div>
    </div>
  );
}
