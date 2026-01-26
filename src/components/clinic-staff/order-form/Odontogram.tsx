'use client';

import { ToothQuadrant, QuadrantType } from './ToothQuadrant';
import { ToothEditMode } from './Tooth';
import { InitialToothStatesMap } from '@/types/initial-tooth-state';
import { ToothConfigStatus } from '@/types/tooth';
import { Icons } from '@/components/ui/Icons';

interface OdontogramProps {
  teethInOrder: string[]; // All teeth in the order
  selectedForConfig: string[]; // Teeth currently selected for configuration
  teethConfigStatus: Map<string, ToothConfigStatus>; // Configuration status per tooth
  teethWithErrors: Set<string>; // Teeth with errors
  onToothToggle?: (toothNumber: string) => void; // Click to add/select (optional for readOnly)
  onToothRemove?: (toothNumber: string) => void; // Remove from order via X button
  onToothSelectIndividual?: (toothNumber: string) => void; // Double-click for individual config
  readOnly?: boolean; // If true, disables all interactions
  initialStates?: InitialToothStatesMap; // Initial states for teeth (NORMAL, AUSENTE, PILAR)
  editMode?: ToothEditMode; // Current edit mode for initial state
  onInitialStateToggle?: (toothNumber: string) => void; // Toggle initial state
  showInitialStatesLegend?: boolean; // Whether to show AUSENTE/PILAR in the legend
}

/**
 * Generates tooth numbers for a quadrant
 * FDI notation: first digit = quadrant (1-4), second digit = position (1-8)
 */
function generateQuadrantTeeth(quadrant: number): string[] {
  return Array.from({ length: 8 }, (_, i) => `${quadrant}${i + 1}`);
}

export function Odontogram({
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
  showInitialStatesLegend = false,
}: OdontogramProps) {
  // Generate teeth for each quadrant
  const upperRight = generateQuadrantTeeth(1).reverse(); // 18-11 (right to left from patient view)
  const upperLeft = generateQuadrantTeeth(2); // 21-28 (left to right from patient view)
  const lowerLeft = generateQuadrantTeeth(3); // 31-38 (left to right from patient view)
  const lowerRight = generateQuadrantTeeth(4).reverse(); // 48-41 (right to left from patient view)

  const quadrantProps = {
    teethInOrder,
    selectedForConfig,
    teethConfigStatus,
    teethWithErrors,
    onToothToggle: onToothToggle || (() => {}),
    onToothRemove: onToothRemove || (() => {}),
    onToothSelectIndividual: onToothSelectIndividual || (() => {}),
    readOnly,
    initialStates,
    editMode,
    onInitialStateToggle,
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-border" />
          <span>Sin configurar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-success bg-success/20" />
          <span>Completo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-warning bg-warning/20" />
          <span>Incompleto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-primary" />
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-4 w-4 rounded bg-primary">
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-danger" />
          </div>
          <span>Error</span>
        </div>
        {showInitialStatesLegend && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border-2 border-dashed border-border opacity-30" />
              <span>Ausente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative h-4 w-4 rounded border-2 border-border">
                <Icons.screw className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-3 text-primary" />
              </div>
              <span>Pilar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative h-4 w-4 rounded border-2 border-success">
                <Icons.implant className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-3 text-success" />
              </div>
              <span>Implante</span>
            </div>
          </>
        )}
      </div>

      {/* Odontogram Chart */}
      <div className="space-y-4">
        {/* Upper Arch */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 text-center">
            <div className="text-xs font-medium text-muted-foreground">Arcada Superior</div>
            <div className="text-[10px] text-muted-foreground/70 mt-0.5">
              (Vista desde el paciente)
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {/* Upper Right (Patient's right) */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">← Derecha</span>
              <ToothQuadrant quadrant="upper-right" teeth={upperRight} {...quadrantProps} />
            </div>

            {/* Vertical divider on desktop */}
            <div className="hidden h-12 w-px bg-border sm:block" />

            {/* Upper Left (Patient's left) */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">Izquierda →</span>
              <ToothQuadrant quadrant="upper-left" teeth={upperLeft} {...quadrantProps} />
            </div>
          </div>
        </div>

        {/* Horizontal Divider */}
        <div className="border-t-2 border-border" />

        {/* Lower Arch */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 text-center">
            <div className="text-xs font-medium text-muted-foreground">Arcada Inferior</div>
            <div className="text-[10px] text-muted-foreground/70 mt-0.5">
              (Vista desde el paciente)
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {/* Lower Right (Patient's right) */}
            <div className="flex flex-col items-center gap-2">
              <ToothQuadrant quadrant="lower-right" teeth={lowerRight} {...quadrantProps} />
              <span className="text-xs text-muted-foreground">← Derecha</span>
            </div>

            {/* Vertical divider on desktop */}
            <div className="hidden h-12 w-px bg-border sm:block" />

            {/* Lower Left (Patient's left) */}
            <div className="flex flex-col items-center gap-2">
              <ToothQuadrant quadrant="lower-left" teeth={lowerLeft} {...quadrantProps} />
              <span className="text-xs text-muted-foreground">Izquierda →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!readOnly && editMode === 'selection' && (
        <p className="text-xs text-muted-foreground text-center">
          <strong>Cómo usar:</strong> Haz clic en un diente para añadirlo a la selección. Si ya está
          seleccionado, haz clic para configurarlo individualmente. Doble clic para configurar un
          solo diente. Usa el botón X para quitar un diente de la orden.
        </p>
      )}

      {/* Edit mode instructions */}
      {!readOnly && editMode === 'ausente' && (
        <p className="text-xs text-warning text-center font-medium">
          <strong>Modo Ausentes:</strong> Haz clic en los dientes que faltan para marcarlos como
          ausentes. Haz clic de nuevo para desmarcarlos.
        </p>
      )}
      {!readOnly && editMode === 'pilar' && (
        <p className="text-xs text-primary text-center font-medium">
          <strong>Modo Pilares:</strong> Haz clic en los dientes pilares (dientes naturales que
          soportan un puente). Haz clic de nuevo para desmarcarlos.
        </p>
      )}
      {!readOnly && editMode === 'implante' && (
        <p className="text-xs text-success text-center font-medium">
          <strong>Modo Implantes:</strong> Haz clic en los dientes con implante. Haz clic de nuevo
          para desmarcarlos.
        </p>
      )}
    </div>
  );
}
