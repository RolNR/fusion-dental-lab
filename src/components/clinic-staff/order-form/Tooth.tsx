'use client';

import { TOOTH_SHAPES, getToothTypeFromNumber, getToothName } from './tooth-shapes';
import { Icons } from '@/components/ui/Icons';
import { ToothInitialState, isToothSelectable } from '@/types/initial-tooth-state';

export type ToothEditMode = 'selection' | 'ausente' | 'pilar';

interface ToothProps {
  toothNumber: string; // FDI notation (11, 12, etc.)
  isSelected: boolean; // In the order
  isCurrent: boolean; // Being configured
  hasData: boolean; // Configured
  hasError: boolean; // Validation error
  onToggle: () => void; // Add/remove from order
  onSelect: () => void; // Select for configuration
  readOnly?: boolean; // If true, disables all interactions
  initialState?: ToothInitialState; // Initial state of the tooth (NORMAL, AUSENTE, PILAR)
  editMode?: ToothEditMode; // Current edit mode for initial state
  onInitialStateToggle?: () => void; // Toggle initial state (called in ausente/pilar edit modes)
}

export function Tooth({
  toothNumber,
  isSelected,
  isCurrent,
  hasData,
  hasError,
  onToggle,
  onSelect,
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

    if (isSelected) {
      // If selected, always open configuration (don't remove)
      onSelect();
    } else {
      // If not selected, add to order
      onToggle();
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    onToggle();
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
    isCurrent && 'ring-2 ring-primary-hover rounded-lg p-1',
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

  const svgClasses = [
    'transition-colors',
    isAusente
      ? 'fill-none stroke-border stroke-dashed'
      : isSelected
        ? 'fill-primary stroke-primary'
        : readOnly
          ? 'fill-none stroke-border'
          : 'fill-none stroke-border hover:fill-muted/20',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClasses = [
    'text-[10px] font-semibold transition-colors',
    isAusente
      ? 'text-muted-foreground/50'
      : isSelected
        ? 'text-primary-foreground'
        : 'text-muted-foreground',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label={`Diente ${toothNumber}, ${toothName}${isAusente ? ', ausente' : ''}${isPilar ? ', pilar' : ''}`}
      aria-pressed={isSelected}
      aria-current={isCurrent ? 'true' : undefined}
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
          <path
            d={shape.path}
            strokeWidth="2"
            strokeDasharray={isAusente ? '4 2' : undefined}
          />
        </svg>

        {/* Status Indicators */}
        {isSelected && !isAusente && (
          <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
            {/* Error or Success badge */}
            {hasError ? (
              <div
                className="flex h-4 w-4 items-center justify-center rounded-full bg-danger"
                title="Error de validación"
              >
                <Icons.alertCircle className="h-3 w-3 text-danger-foreground" />
              </div>
            ) : hasData ? (
              <div
                className="flex h-4 w-4 items-center justify-center rounded-full bg-success"
                title="Configurado"
              >
                <Icons.check className="h-3 w-3 text-success-foreground" />
              </div>
            ) : null}

            {/* Remove button for ALL selected teeth (hidden in readOnly mode) */}
            {!readOnly && editMode === 'selection' && (
              <button
                onClick={handleRemoveClick}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-muted hover:bg-danger transition-colors"
                title="Quitar diente"
                type="button"
              >
                <Icons.x className="h-3 w-3 text-foreground hover:text-danger-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Edit icon when tooth is being configured */}
        {isCurrent && !readOnly && editMode === 'selection' && (
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
