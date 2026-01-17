'use client';

import { Tooth } from './Tooth';

export type QuadrantType = 'upper-right' | 'upper-left' | 'lower-left' | 'lower-right';

interface ToothQuadrantProps {
  quadrant: QuadrantType;
  teeth: string[]; // Array of 8 tooth numbers (e.g., ["11", "12", ..., "18"])
  selectedTeeth: string[]; // Teeth in the order
  currentTooth: string | null; // Tooth being configured
  teethWithData: Set<string>; // Configured teeth
  teethWithErrors: Set<string>; // Teeth with validation errors
  onToothToggle: (toothNumber: string) => void; // Add/remove tooth
  onToothSelect: (toothNumber: string) => void; // Select for configuration
}

export function ToothQuadrant({
  quadrant,
  teeth,
  selectedTeeth,
  currentTooth,
  teethWithData,
  teethWithErrors,
  onToothToggle,
  onToothSelect,
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
          isSelected={selectedTeeth.includes(toothNumber)}
          isCurrent={currentTooth === toothNumber}
          hasData={teethWithData.has(toothNumber)}
          hasError={teethWithErrors.has(toothNumber)}
          onToggle={() => onToothToggle(toothNumber)}
          onSelect={() => onToothSelect(toothNumber)}
        />
      ))}
    </div>
  );
}
