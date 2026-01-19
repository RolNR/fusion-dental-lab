'use client';

import { TOOTH_SHAPES, getToothTypeFromNumber, getToothName } from './tooth-shapes';
import { Icons } from '@/components/ui/Icons';

interface ToothProps {
  toothNumber: string; // FDI notation (11, 12, etc.)
  isSelected: boolean; // In the order
  isCurrent: boolean; // Being configured
  hasData: boolean; // Configured
  hasError: boolean; // Validation error
  onToggle: () => void; // Add/remove from order
  onSelect: () => void; // Select for configuration
  readOnly?: boolean; // If true, disables all interactions
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
}: ToothProps) {
  const toothType = getToothTypeFromNumber(toothNumber);
  const toothName = getToothName(toothNumber);
  const shape = TOOTH_SHAPES[toothType];

  const handleClick = () => {
    if (readOnly) return; // Disable clicks in readOnly mode

    if (isSelected) {
      // If selected, always open configuration (don't remove)
      onSelect();
    } else {
      // If not selected, add to order
      onToggle();
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    if (readOnly) return; // Disable clicks in readOnly mode
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
  ]
    .filter(Boolean)
    .join(' ');

  const svgClasses = [
    'transition-colors',
    isSelected
      ? 'fill-primary stroke-primary'
      : readOnly
        ? 'fill-none stroke-border'
        : 'fill-none stroke-border hover:fill-muted/20',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClasses = [
    'text-[10px] font-semibold transition-colors',
    isSelected ? 'text-primary-foreground' : 'text-muted-foreground',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label={`Diente ${toothNumber}, ${toothName}`}
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
          <path d={shape.path} strokeWidth="2" />
        </svg>

        {/* Status Indicators */}
        {isSelected && (
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
            {!readOnly && (
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
        {isCurrent && !readOnly && (
          <div className="absolute -top-1 -left-1">
            <div
              className="flex h-4 w-4 items-center justify-center rounded-full bg-primary"
              title="Configurando"
            >
              <Icons.settings className="h-3 w-3 text-primary-foreground" />
            </div>
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
