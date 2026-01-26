'use client';

import { Tooth, ToothEditMode } from './Tooth';
import { InitialToothStatesMap, getToothInitialState } from '@/types/initial-tooth-state';
import { ToothConfigStatus } from '@/types/tooth';

export type QuadrantType = 'upper-right' | 'upper-left' | 'lower-left' | 'lower-right';

interface ToothQuadrantProps {
  quadrant: QuadrantType;
  teeth: string[]; // Array of 8 tooth numbers (e.g., ["11", "12", ..., "18"])
  teethInOrder: string[]; // All teeth in the order
  selectedForConfig: string[]; // Teeth currently selected for configuration
  teethConfigStatus: Map<string, ToothConfigStatus>; // Configuration status per tooth
  teethWithErrors: Set<string>; // Teeth with validation errors
  onToothToggle: (toothNumber: string) => void; // Click to add/select
  onToothRemove: (toothNumber: string) => void; // Remove from order (X button)
  onToothSelectIndividual: (toothNumber: string) => void; // Double-click for individual config
  readOnly?: boolean; // If true, disables all interactions
  initialStates?: InitialToothStatesMap; // Initial states for teeth (NORMAL, AUSENTE, PILAR)
  editMode?: ToothEditMode; // Current edit mode for initial state
  onInitialStateToggle?: (toothNumber: string) => void; // Toggle initial state
}

export function ToothQuadrant({
  quadrant,
  teeth,
  teethInOrder,
  selectedForConfig,
  teethConfigStatus,
  teethWithErrors,
  onToothToggle,
  onToothRemove,
  onToothSelectIndividual,
  readOnly = false,
  initialStates,
  editMode = 'selection',
  onInitialStateToggle,
}: ToothQuadrantProps) {
  // Determine if teeth should be reversed for anatomical accuracy
  // Upper quadrants: left-to-right (11→18, 21→28)
  // Lower quadrants: maintain left-to-right (31→38, 41→48)
  const displayTeeth = [...teeth];

  // Apply proper ordering based on quadrant
  // FDI notation: first digit = quadrant, second digit = position
  // Upper right (1x): 11, 12, 13, 14, 15, 16, 17, 18 (left to right)
  // Upper left (2x): 21, 22, 23, 24, 25, 26, 27, 28 (left to right)
  // Lower left (3x): 31, 32, 33, 34, 35, 36, 37, 38 (left to right)
  // Lower right (4x): 41, 42, 43, 44, 45, 46, 47, 48 (left to right)
  // All are displayed left-to-right in anatomical view

  return (
    <div className="flex items-center gap-1">
      {displayTeeth.map((toothNumber) => (
        <Tooth
          key={toothNumber}
          toothNumber={toothNumber}
          isInOrder={teethInOrder.includes(toothNumber)}
          isSelectedForConfig={selectedForConfig.includes(toothNumber)}
          configStatus={teethConfigStatus.get(toothNumber) ?? 'none'}
          hasError={teethWithErrors.has(toothNumber)}
          onToggle={() => onToothToggle(toothNumber)}
          onRemove={() => onToothRemove(toothNumber)}
          onSelectIndividual={() => onToothSelectIndividual(toothNumber)}
          readOnly={readOnly}
          initialState={getToothInitialState(initialStates, toothNumber)}
          editMode={editMode}
          onInitialStateToggle={() => onInitialStateToggle?.(toothNumber)}
        />
      ))}
    </div>
  );
}
