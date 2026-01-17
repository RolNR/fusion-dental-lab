import { Icons } from '@/components/ui/Icons';

interface ToothSelectorProps {
  teethNumbers: string[];
  selectedTooth: string | null;
  onToothSelect: (toothNumber: string) => void;
  teethWithData: Set<string>;
  teethWithErrors: Set<string>;
}

export function ToothSelector({
  teethNumbers,
  selectedTooth,
  onToothSelect,
  teethWithData,
  teethWithErrors,
}: ToothSelectorProps) {
  if (teethNumbers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-2">
        <label className="text-sm font-medium text-foreground">
          Selecciona el diente a configurar
        </label>
        <p className="text-xs text-muted-foreground mt-1">
          Configura cada diente individualmente o copia la configuración entre dientes
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {teethNumbers.map((toothNumber) => {
          const isSelected = selectedTooth === toothNumber;
          const hasData = teethWithData.has(toothNumber);
          const hasError = teethWithErrors.has(toothNumber);

          return (
            <button
              key={toothNumber}
              type="button"
              onClick={() => onToothSelect(toothNumber)}
              className={`
                relative px-4 py-2 rounded-md font-medium text-sm transition-all
                ${
                  isSelected
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                    : 'bg-background text-foreground hover:bg-muted border border-border'
                }
                ${hasError ? 'ring-2 ring-danger' : ''}
              `}
            >
              <span className="flex items-center gap-1.5">
                {toothNumber}
                {hasData && !hasError && (
                  <Icons.check className="h-3 w-3 text-success" />
                )}
                {hasError && (
                  <Icons.alertCircle className="h-3 w-3 text-danger" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {selectedTooth && (
        <div className="mt-3 text-xs text-muted-foreground">
          Configurando diente: <span className="font-semibold text-foreground">{selectedTooth}</span>
        </div>
      )}
    </div>
  );
}
