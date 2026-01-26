'use client';

import { TOOTH_SHAPES, getToothTypeFromNumber, getToothName } from './tooth-shapes';
import { Icons } from '@/components/ui/Icons';
import { ToothInitialState } from '@/types/initial-tooth-state';
import { ToothConfigStatus } from '@/types/tooth';

export type ToothEditMode = 'selection' | 'ausente' | 'pilar';

interface ToothProps {
  toothNumber: string; // FDI notation (11, 12, etc.)
  isInOrder: boolean; // Tooth is part of the order
  isSelectedForConfig: boolean; // Tooth is currently selected for configuration
  configStatus: ToothConfigStatus; // Configuration completeness: 'complete' | 'incomplete' | 'none'
  hasError: boolean; // Validation error
  onToggle: () => void; // Click to add/select
  onRemove: () => void; // Remove from order (X button)
  onSelectIndividual: () => void; // Double-click for individual config
  readOnly?: boolean; // If true, disables all interactions
  initialState?: ToothInitialState; // Initial state of the tooth (NORMAL, AUSENTE, PILAR)
  editMode?: ToothEditMode; // Current edit mode for initial state
  onInitialStateToggle?: () => void; // Toggle initial state (called in ausente/pilar edit modes)
}

export function Tooth({
  toothNumber,
  isInOrder,
  isSelectedForConfig,
  configStatus,
  hasError,
  onToggle,
  onRemove,
  onSelectIndividual,
  readOnly = false,
  initialState = 'NORMAL',
  editMode = 'selection',
  onInitialStateToggle,
}: ToothProps) {
  const toothType = getToothTypeFromNumber(toothNumber);
  const toothName = getToothName(toothNumber);
  const shape = TOOTH_SHAPES[toothType];

  const isAusente = initialState === 'AUSENTE';
  const isPilar = initialState === 'PILAR';

  const handleClick = () => {
    if (readOnly) return;

    // Handle edit modes for initial state
    if (editMode === 'ausente' || editMode === 'pilar') {
      onInitialStateToggle?.();
      return;
    }

    // Standard selection mode - but block AUSENTE teeth
    if (isAusente) {
      return; // Can't select missing teeth
    }

    // Click behavior: add to selection, or switch to individual config if already selected
    onToggle();
  };

  const handleDoubleClick = () => {
    if (readOnly) return;
    if (editMode !== 'selection') return;
    if (isAusente) return;

    // Double-click: select only this tooth for individual configuration
    onSelectIndividual();
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    onRemove();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Dynamic classes based on state
  const containerClasses = [
    'relative flex flex-col items-center gap-1 transition-transform',
    !readOnly && 'cursor-pointer hover:scale-105',
    // Highlight teeth selected for configuration
    isSelectedForConfig && 'ring-2 ring-primary-hover rounded-lg p-1',
    // AUSENTE: ghost appearance
    isAusente && 'opacity-30',
    // Highlight in edit modes
    editMode === 'ausente' && !isAusente && 'ring-2 ring-muted ring-dashed rounded-lg',
    editMode === 'pilar' && !isPilar && 'ring-2 ring-muted ring-dashed rounded-lg',
    editMode === 'ausente' && isAusente && 'ring-2 ring-warning rounded-lg',
    editMode === 'pilar' && isPilar && 'ring-2 ring-primary rounded-lg',
  ]
    .filter(Boolean)
    .join(' ');

  // Determine fill color based on selection and config status
  const getSvgFillClass = () => {
    if (isAusente) return 'fill-none stroke-border stroke-dashed';

    // Teeth selected for configuration - show as primary
    if (isSelectedForConfig) return 'fill-primary stroke-primary';

    // Teeth in order but not currently selected - show config status
    if (isInOrder) {
      if (configStatus === 'complete') {
        return 'fill-success/20 stroke-success hover:fill-success/30';
      }
      if (configStatus === 'incomplete') {
        return 'fill-warning/20 stroke-warning hover:fill-warning/30';
      }
      // In order but no config yet
      return 'fill-primary/10 stroke-primary/50 hover:fill-primary/20';
    }

    // Not in order - show config status if any (from previous config)
    if (configStatus === 'complete') {
      return 'fill-success/20 stroke-success hover:fill-success/30';
    }
    if (configStatus === 'incomplete') {
      return 'fill-warning/20 stroke-warning hover:fill-warning/30';
    }

    // No config
    if (readOnly) return 'fill-none stroke-border';
    return 'fill-none stroke-border hover:fill-muted/20';
  };

  const svgClasses = ['transition-colors', getSvgFillClass()].filter(Boolean).join(' ');

  // Determine label color based on selection and config status
  const getLabelClass = () => {
    if (isAusente) return 'text-muted-foreground/50';
    if (isSelectedForConfig) return 'text-primary-foreground';

    // In order but not selected - show config status colors
    if (isInOrder) {
      if (configStatus === 'complete') return 'text-success';
      if (configStatus === 'incomplete') return 'text-warning';
      return 'text-primary/70';
    }

    // Not in order - show config status colors if any
    if (configStatus === 'complete') return 'text-success';
    if (configStatus === 'incomplete') return 'text-warning';

    return 'text-muted-foreground';
  };

  const labelClasses = ['text-[10px] font-semibold transition-colors', getLabelClass()]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label={`Diente ${toothNumber}, ${toothName}${isAusente ? ', ausente' : ''}${isPilar ? ', pilar' : ''}${isInOrder ? ', en orden' : ''}${isSelectedForConfig ? ', configurando' : ''}`}
      aria-pressed={isInOrder}
      aria-current={isSelectedForConfig ? 'true' : undefined}
      tabIndex={0}
    >
      {/* SVG Tooth */}
      <div className="relative">
        <svg
          width={shape.width}
          height={shape.height}
          viewBox={`0 0 ${shape.width} ${shape.height}`}
          className={svgClasses}
          style={{ minWidth: shape.width, minHeight: shape.height }}
        >
          <path d={shape.path} strokeWidth="2" strokeDasharray={isAusente ? '4 2' : undefined} />
        </svg>

        {/* Status Indicators - shown for teeth in order */}
        {isInOrder && !isAusente && (
          <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
            {/* Error, Complete, or Incomplete badge */}
            {hasError ? (
              <div
                className="flex h-4 w-4 items-center justify-center rounded-full bg-danger"
                title="Error de validación"
              >
                <Icons.alertCircle className="h-3 w-3 text-danger-foreground" />
              </div>
            ) : configStatus === 'complete' ? (
              <div
                className="flex h-4 w-4 items-center justify-center rounded-full bg-success"
                title="Configuración completa"
              >
                <Icons.check className="h-3 w-3 text-success-foreground" />
              </div>
            ) : configStatus === 'incomplete' ? (
              <div
                className="flex h-4 w-4 items-center justify-center rounded-full bg-warning"
                title="Configuración incompleta"
              >
                <Icons.alertCircle className="h-3 w-3 text-warning-foreground" />
              </div>
            ) : null}

            {/* Remove button for teeth in order (hidden in readOnly mode) */}
            {!readOnly && editMode === 'selection' && (
              <button
                onClick={handleRemoveClick}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-muted hover:bg-danger transition-colors"
                title="Quitar diente de la orden"
                type="button"
              >
                <Icons.x className="h-3 w-3 text-foreground hover:text-danger-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Edit icon when tooth is being configured */}
        {isSelectedForConfig && !readOnly && editMode === 'selection' && (
          <div className="absolute -top-1 -left-1">
            <div
              className="flex h-4 w-4 items-center justify-center rounded-full bg-primary"
              title="Configurando"
            >
              <Icons.settings className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        )}

        {/* PILAR indicator - screw icon below the tooth */}
        {isPilar && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
            <Icons.screw className="h-4 w-4 text-primary" />
          </div>
        )}

        {/* Tooth Number Label (centered in tooth) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ top: '40%' }}
        >
          <span className={labelClasses}>{toothNumber}</span>
        </div>
      </div>
    </div>
  );
}
