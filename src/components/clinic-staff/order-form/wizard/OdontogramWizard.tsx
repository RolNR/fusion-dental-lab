'use client';

import { useState, useCallback, useEffect } from 'react';
import { RestorationType } from '@prisma/client';
import { WizardStepIndicator } from './WizardStepIndicator';
import { Step1InitialStates } from './Step1InitialStates';
import { Step2AssignWork } from './Step2AssignWork';
import { InitialStateTool } from './InitialStateToolbar';
import { ImplantData } from './ImplantInfoList';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { useGuidedTooltips } from '@/hooks/useGuidedTooltips';
import { ToothData, BridgeDefinition } from '@/types/tooth';
import { ImplantInfo } from '@/types/order';
import {
  InitialToothStatesMap,
  ToothInitialState,
  getToothInitialState,
} from '@/types/initial-tooth-state';
import { useToast } from '@/contexts/ToastContext';

interface OdontogramWizardProps {
  initialStates?: InitialToothStatesMap;
  teethData?: Map<string, ToothData>;
  bridges?: BridgeDefinition[];
  onInitialStatesChange: (states: InitialToothStatesMap) => void;
  onTeethDataChange: (data: Map<string, ToothData>) => void;
  onBridgesChange: (bridges: BridgeDefinition[]) => void;
  onTeethInOrderChange: (teeth: string[]) => void;
  disabled?: boolean;
  initialStep?: 1 | 2;
}

// Generate unique ID for bridges
function generateBridgeId(): string {
  return `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get teeth numbers in a range (same quadrant/arch)
function getTeethInRange(
  start: string,
  end: string,
  initialStates: InitialToothStatesMap
): string[] {
  const startNum = parseInt(start, 10);
  const endNum = parseInt(end, 10);

  // Determine arch and quadrant
  const startQuadrant = Math.floor(startNum / 10);
  const endQuadrant = Math.floor(endNum / 10);

  // Must be in same arch (upper: 1,2 or lower: 3,4)
  const startIsUpper = startQuadrant <= 2;
  const endIsUpper = endQuadrant <= 2;
  if (startIsUpper !== endIsUpper) {
    return []; // Can't span arches
  }

  // Get all teeth in range
  const teeth: string[] = [];

  if (startIsUpper) {
    // Upper arch: quadrants 1 and 2
    // Q1: 18,17,16,15,14,13,12,11 (right to midline)
    // Q2: 21,22,23,24,25,26,27,28 (midline to left)
    const q1Teeth = [18, 17, 16, 15, 14, 13, 12, 11];
    const q2Teeth = [21, 22, 23, 24, 25, 26, 27, 28];
    const upperOrder = [...q1Teeth, ...q2Teeth];

    const startIdx = upperOrder.indexOf(startNum);
    const endIdx = upperOrder.indexOf(endNum);

    if (startIdx === -1 || endIdx === -1) return [];

    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);

    for (let i = minIdx; i <= maxIdx; i++) {
      teeth.push(upperOrder[i].toString());
    }
  } else {
    // Lower arch: quadrants 4 and 3
    // Q4: 48,47,46,45,44,43,42,41 (right to midline)
    // Q3: 31,32,33,34,35,36,37,38 (midline to left)
    const q4Teeth = [48, 47, 46, 45, 44, 43, 42, 41];
    const q3Teeth = [31, 32, 33, 34, 35, 36, 37, 38];
    const lowerOrder = [...q4Teeth, ...q3Teeth];

    const startIdx = lowerOrder.indexOf(startNum);
    const endIdx = lowerOrder.indexOf(endNum);

    if (startIdx === -1 || endIdx === -1) return [];

    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);

    for (let i = minIdx; i <= maxIdx; i++) {
      teeth.push(lowerOrder[i].toString());
    }
  }

  return teeth;
}

export function OdontogramWizard({
  initialStates = {},
  teethData: externalTeethData,
  bridges: externalBridges,
  onInitialStatesChange,
  onTeethDataChange,
  onBridgesChange,
  onTeethInOrderChange,
  disabled = false,
  initialStep = 1,
}: OdontogramWizardProps) {
  // Toast notifications
  const { addToast } = useToast();

  // Guided tooltips - lifted to parent so reset works across all children
  const { resetTooltips, shouldShowTooltip, dismissTooltip, dismissedTooltips } =
    useGuidedTooltips();

  // State
  const [currentStep, setCurrentStep] = useState<1 | 2>(initialStep);
  const [step1Tool, setStep1Tool] = useState<InitialStateTool>(null);
  const [step2Tool, setStep2Tool] = useState<RestorationType | null>(null);
  const [bridgeStart, setBridgeStart] = useState<string | null>(null);
  const [implantData, setImplantData] = useState<Map<string, ImplantData>>(new Map());

  // Sync currentStep when parent changes initialStep (e.g., AI fills teeth data)
  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  // Initialize implantData from external teethData when it has implant info
  useEffect(() => {
    if (!externalTeethData || externalTeethData.size === 0) return;
    const newImplantData = new Map<string, ImplantData>();
    for (const [toothNumber, tooth] of externalTeethData) {
      if (tooth.trabajoSobreImplante && tooth.informacionImplante) {
        newImplantData.set(toothNumber, {
          toothNumber,
          marcaImplante: tooth.informacionImplante.marcaImplante,
          sistemaConexion: tooth.informacionImplante.sistemaConexion,
        });
      }
    }
    if (newImplantData.size > 0) {
      setImplantData((prev) => {
        // Only update if there's new data not already in state
        const merged = new Map(prev);
        for (const [key, value] of newImplantData) {
          if (!merged.has(key)) {
            merged.set(key, value);
          }
        }
        return merged;
      });
    }
  }, [externalTeethData]);

  // Use external state if provided, otherwise use internal
  const [internalTeethData, setInternalTeethData] = useState<Map<string, ToothData>>(new Map());
  const [internalBridges, setInternalBridges] = useState<BridgeDefinition[]>([]);

  const teethData = externalTeethData ?? internalTeethData;
  const bridges = externalBridges ?? internalBridges;

  const setTeethData = useCallback(
    (
      updater: Map<string, ToothData> | ((prev: Map<string, ToothData>) => Map<string, ToothData>)
    ) => {
      if (typeof updater === 'function') {
        const newData = updater(teethData);
        if (externalTeethData) {
          onTeethDataChange(newData);
        } else {
          setInternalTeethData(newData);
        }
      } else {
        if (externalTeethData) {
          onTeethDataChange(updater);
        } else {
          setInternalTeethData(updater);
        }
      }
    },
    [teethData, externalTeethData, onTeethDataChange]
  );

  const setBridges = useCallback(
    (updater: BridgeDefinition[] | ((prev: BridgeDefinition[]) => BridgeDefinition[])) => {
      if (typeof updater === 'function') {
        const newBridges = updater(bridges);
        if (externalBridges) {
          onBridgesChange(newBridges);
        } else {
          setInternalBridges(newBridges);
        }
      } else {
        if (externalBridges) {
          onBridgesChange(updater);
        } else {
          setInternalBridges(updater);
        }
      }
    },
    [bridges, externalBridges, onBridgesChange]
  );

  // Update teethInOrder whenever teeth data changes
  const updateTeethInOrder = useCallback(() => {
    const teeth: string[] = [];
    for (const [toothNumber, data] of teethData) {
      if (data.tipoRestauracion) {
        teeth.push(toothNumber);
      }
    }
    // Add bridge teeth
    bridges.forEach((bridge) => {
      if (!teeth.includes(bridge.startTooth)) teeth.push(bridge.startTooth);
      if (!teeth.includes(bridge.endTooth)) teeth.push(bridge.endTooth);
      bridge.pontics.forEach((p) => {
        if (!teeth.includes(p)) teeth.push(p);
      });
    });
    onTeethInOrderChange(teeth.sort((a, b) => parseInt(a, 10) - parseInt(b, 10)));
  }, [teethData, bridges, onTeethInOrderChange]);

  // Step 1: Handle initial state toggle
  const handleInitialStateToggle = useCallback(
    (toothNumber: string) => {
      if (!step1Tool) return;

      const currentState = getToothInitialState(initialStates, toothNumber);
      const newStates = { ...initialStates };

      // Map tool to state
      const targetState: ToothInitialState =
        step1Tool === 'ausente' ? 'AUSENTE' : step1Tool === 'pilar' ? 'PILAR' : 'IMPLANTE';

      if (currentState === targetState) {
        // Remove state (back to NORMAL)
        delete newStates[toothNumber];

        // Also remove implant data if it was an implant
        if (targetState === 'IMPLANTE') {
          setImplantData((prev) => {
            const newMap = new Map(prev);
            newMap.delete(toothNumber);
            return newMap;
          });
        }
      } else {
        // Set new state
        newStates[toothNumber] = targetState;

        // Initialize implant data entry if marking as implant
        if (targetState === 'IMPLANTE') {
          setImplantData((prev) => {
            const newMap = new Map(prev);
            if (!newMap.has(toothNumber)) {
              newMap.set(toothNumber, { toothNumber });
            }
            return newMap;
          });
        }
      }

      onInitialStatesChange(newStates);
    },
    [step1Tool, initialStates, onInitialStatesChange]
  );

  // Step 1: Handle implant info update
  const handleImplantUpdate = useCallback((toothNumber: string, updates: Partial<ImplantInfo>) => {
    setImplantData((prev) => {
      const newMap = new Map(prev);
      const currentData = newMap.get(toothNumber) || { toothNumber };
      newMap.set(toothNumber, { ...currentData, ...updates });
      return newMap;
    });
  }, []);

  // Step 2: Handle tooth click for work assignment
  const handleStep2ToothClick = useCallback(
    (toothNumber: string) => {
      if (!step2Tool) return;

      const state = getToothInitialState(initialStates, toothNumber);

      if (step2Tool === 'puente') {
        // Bridge mode
        if (!bridgeStart) {
          // First click - set start
          setBridgeStart(toothNumber);
        } else {
          // Check if same tooth clicked twice
          if (bridgeStart === toothNumber) {
            addToast('Debes seleccionar un diente diferente para completar el puente', 'warning');
            setBridgeStart(null);
            return;
          }

          // Second click - complete bridge
          const teethInRange = getTeethInRange(bridgeStart, toothNumber, initialStates);

          if (teethInRange.length === 0) {
            // Teeth are in different arches
            addToast('Los dientes deben estar en la misma arcada (superior o inferior)', 'error');
            setBridgeStart(null);
            return;
          }

          if (teethInRange.length < 2) {
            // Invalid bridge (must span at least 2 teeth)
            addToast('El puente debe incluir al menos 2 dientes', 'error');
            setBridgeStart(null);
            return;
          }

          // Find pontics (AUSENTE teeth in range)
          const pontics = teethInRange.filter(
            (t) =>
              t !== bridgeStart &&
              t !== toothNumber &&
              getToothInitialState(initialStates, t) === 'AUSENTE'
          );

          // Create bridge
          const bridge: BridgeDefinition = {
            id: generateBridgeId(),
            startTooth: bridgeStart,
            endTooth: toothNumber,
            pontics,
          };

          setBridges((prev) => [...prev, bridge]);

          // Add all bridge teeth to teethData
          const newTeethData = new Map(teethData);
          teethInRange.forEach((tooth) => {
            const isImplante = getToothInitialState(initialStates, tooth) === 'IMPLANTE';
            const implantInfo = implantData.get(tooth);
            newTeethData.set(tooth, {
              toothNumber: tooth,
              tipoRestauracion: 'puente',
              trabajoSobreImplante: isImplante || undefined,
              informacionImplante:
                isImplante && implantInfo
                  ? {
                      marcaImplante: implantInfo.marcaImplante,
                      sistemaConexion: implantInfo.sistemaConexion,
                    }
                  : undefined,
            });
          });
          setTeethData(newTeethData);

          setBridgeStart(null);
          updateTeethInOrder();

          addToast(
            `Puente creado: #${bridgeStart} - #${toothNumber} (${teethInRange.length} dientes)`,
            'success'
          );
        }
      } else {
        // Non-bridge work type
        if (state === 'AUSENTE') {
          return; // Can't assign work directly to missing teeth
        }

        const currentData = teethData.get(toothNumber);
        const newTeethData = new Map(teethData);

        if (currentData?.tipoRestauracion === step2Tool) {
          // Toggle off - remove work assignment
          newTeethData.delete(toothNumber);
        } else {
          // Toggle on - assign work
          const isImplante = state === 'IMPLANTE';
          const implantInfo = implantData.get(toothNumber);
          newTeethData.set(toothNumber, {
            toothNumber,
            tipoRestauracion: step2Tool,
            trabajoSobreImplante: isImplante || undefined,
            informacionImplante:
              isImplante && implantInfo
                ? {
                    marcaImplante: implantInfo.marcaImplante,
                    sistemaConexion: implantInfo.sistemaConexion,
                  }
                : undefined,
            ...currentData,
          });
        }

        setTeethData(newTeethData);
        updateTeethInOrder();
      }
    },
    [
      step2Tool,
      bridgeStart,
      initialStates,
      teethData,
      implantData,
      setTeethData,
      setBridges,
      updateTeethInOrder,
      addToast,
    ]
  );

  // Handle bulk tooth data update (for applying to multiple teeth at once)
  const handleBulkToothUpdate = useCallback(
    (updates: Map<string, Partial<ToothData>>) => {
      const newTeethData = new Map(teethData);
      for (const [toothNumber, toothUpdates] of updates) {
        const currentData = newTeethData.get(toothNumber) || { toothNumber };
        newTeethData.set(toothNumber, { ...currentData, ...toothUpdates });
      }
      setTeethData(newTeethData);
    },
    [teethData, setTeethData]
  );

  // Handle tooth remove (also handles bridge removal if tooth is part of a bridge)
  const handleToothRemove = useCallback(
    (toothNumber: string) => {
      // Check if this tooth is part of a bridge by computing the range for each bridge
      const parentBridge = bridges.find((b) => {
        const teethInRange = getTeethInRange(b.startTooth, b.endTooth, initialStates);
        return teethInRange.includes(toothNumber);
      });

      if (parentBridge) {
        // Remove entire bridge and ALL its teeth (using getTeethInRange to get all teeth)
        const newTeethData = new Map(teethData);
        const teethToRemove = getTeethInRange(
          parentBridge.startTooth,
          parentBridge.endTooth,
          initialStates
        );
        teethToRemove.forEach((t) => newTeethData.delete(t));
        setTeethData(newTeethData);
        setBridges((prev) => prev.filter((b) => b.id !== parentBridge.id));
      } else {
        // Remove individual tooth
        const newTeethData = new Map(teethData);
        newTeethData.delete(toothNumber);
        setTeethData(newTeethData);
      }
      updateTeethInOrder();
    },
    [teethData, bridges, initialStates, setTeethData, setBridges, updateTeethInOrder]
  );

  // Handle bridge update
  const handleBridgeUpdate = useCallback(
    (bridgeId: string, updates: Partial<BridgeDefinition>) => {
      setBridges((prev) => prev.map((b) => (b.id === bridgeId ? { ...b, ...updates } : b)));
    },
    [setBridges]
  );

  // Handle bridge remove
  const handleBridgeRemove = useCallback(
    (bridgeId: string) => {
      const bridge = bridges.find((b) => b.id === bridgeId);
      if (!bridge) return;

      // Remove ALL bridge teeth from teethData (using getTeethInRange to get all teeth)
      const newTeethData = new Map(teethData);
      const teethToRemove = getTeethInRange(bridge.startTooth, bridge.endTooth, initialStates);
      teethToRemove.forEach((t) => newTeethData.delete(t));
      setTeethData(newTeethData);

      // Remove bridge
      setBridges((prev) => prev.filter((b) => b.id !== bridgeId));
      updateTeethInOrder();
    },
    [bridges, teethData, initialStates, setTeethData, setBridges, updateTeethInOrder]
  );

  // Navigation
  const handleNext = useCallback(() => {
    setStep1Tool(null);
    setCurrentStep(2);
  }, []);

  const handleBack = useCallback(() => {
    setStep2Tool(null);
    setBridgeStart(null);
    setCurrentStep(1);
  }, []);

  const handleStepClick = useCallback((step: 1 | 2) => {
    if (step === 1) {
      setStep2Tool(null);
      setBridgeStart(null);
    } else {
      setStep1Tool(null);
    }
    setCurrentStep(step);
  }, []);

  // Handle tool changes with automatic bridge start reset
  const handleStep2ToolChange = useCallback((tool: RestorationType | null) => {
    setStep2Tool(tool);
    if (tool !== 'puente') {
      setBridgeStart(null);
    }
  }, []);

  return (
    <div className="rounded-xl bg-background p-6 shadow-md border border-border">
      {/* Header with Step Indicator and Help Button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <WizardStepIndicator
            currentStep={currentStep}
            onStepClick={handleStepClick}
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetTooltips}
          title="Ver tutorial"
          aria-label="Ver tutorial"
          className="!ring-0 !ring-offset-0 focus:!ring-0"
        >
          <Icons.helpCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Step Content */}
      {currentStep === 1 ? (
        <Step1InitialStates
          initialStates={initialStates}
          implantData={implantData}
          activeTool={step1Tool}
          onToolChange={setStep1Tool}
          onInitialStateToggle={handleInitialStateToggle}
          onImplantUpdate={handleImplantUpdate}
          onNext={handleNext}
          disabled={disabled}
          shouldShowTooltip={shouldShowTooltip}
          dismissTooltip={dismissTooltip}
        />
      ) : (
        <Step2AssignWork
          initialStates={initialStates}
          teethData={teethData}
          bridges={bridges}
          activeTool={step2Tool}
          bridgeStart={bridgeStart}
          onToolChange={handleStep2ToolChange}
          onToothClick={handleStep2ToothClick}
          shouldShowTooltip={shouldShowTooltip}
          dismissTooltip={dismissTooltip}
          dismissedTooltips={dismissedTooltips}
          onBulkToothUpdate={handleBulkToothUpdate}
          onToothRemove={handleToothRemove}
          onBridgeUpdate={handleBridgeUpdate}
          onBridgeRemove={handleBridgeRemove}
          onBack={handleBack}
          disabled={disabled}
        />
      )}
    </div>
  );
}
