import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface ToothActionsProps {
  sourceTooth: string;
  allTeeth: string[];
  onCopyToAll: () => void;
  onCopyToSelected: (targetTeeth: string[]) => void;
}

export function ToothActions({
  sourceTooth,
  allTeeth,
  onCopyToAll,
  onCopyToSelected,
}: ToothActionsProps) {
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());

  const otherTeeth = allTeeth.filter((t) => t !== sourceTooth);

  const handleToggleTarget = (toothNumber: string) => {
    setSelectedTargets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toothNumber)) {
        newSet.delete(toothNumber);
      } else {
        newSet.add(toothNumber);
      }
      return newSet;
    });
  };

  const handleCopyToSelected = () => {
    if (selectedTargets.size > 0) {
      onCopyToSelected(Array.from(selectedTargets));
      setShowSelectModal(false);
      setSelectedTargets(new Set());
    }
  };

  if (otherTeeth.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-3">
        <label className="text-sm font-medium text-foreground">Copiar Configuración</label>
        <p className="text-xs text-muted-foreground mt-1">
          Copia la configuración del diente {sourceTooth} a otros dientes
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCopyToAll}>
          <Icons.copy className="h-4 w-4 mr-2" />
          Copiar a Todos
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowSelectModal(true)}
        >
          <Icons.copy className="h-4 w-4 mr-2" />
          Copiar a Seleccionados
        </Button>
      </div>

      {/* Selection Modal */}
      {showSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Selecciona Dientes de Destino
            </h3>

            <p className="text-sm text-muted-foreground mb-4">
              Selecciona los dientes a los que deseas copiar la configuración del diente{' '}
              {sourceTooth}
            </p>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {otherTeeth.map((toothNumber) => (
                <button
                  key={toothNumber}
                  type="button"
                  onClick={() => handleToggleTarget(toothNumber)}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium transition-all
                    ${
                      selectedTargets.has(toothNumber)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                    }
                  `}
                >
                  {toothNumber}
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSelectModal(false);
                  setSelectedTargets(new Set());
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCopyToSelected}
                disabled={selectedTargets.size === 0}
              >
                Copiar ({selectedTargets.size})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
