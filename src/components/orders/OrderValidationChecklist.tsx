'use client';

import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

export interface ValidationAlert {
  id: string;
  type: 'blocking' | 'warning' | 'suggestion';
  message: string;
  field?: string;
  action?: string;
}

interface OrderValidationChecklistProps {
  alerts: ValidationAlert[];
  onContinue: () => void;
  onGoBack: () => void;
  isLoading?: boolean;
}

export function OrderValidationChecklist({
  alerts,
  onContinue,
  onGoBack,
  isLoading = false,
}: OrderValidationChecklistProps) {
  // Group alerts by type
  const blockingAlerts = alerts.filter((a) => a.type === 'blocking');
  const warningAlerts = alerts.filter((a) => a.type === 'warning');
  const suggestionAlerts = alerts.filter((a) => a.type === 'suggestion');

  const hasBlockingAlerts = blockingAlerts.length > 0;

  // If no alerts, don't render anything
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-background shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-muted/50 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icons.clipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Revisión de Orden</h2>
              <p className="text-sm text-muted-foreground">
                {hasBlockingAlerts
                  ? 'Hay problemas que debes corregir antes de enviar'
                  : 'Revisa las siguientes observaciones'}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Blocking Alerts */}
          {blockingAlerts.length > 0 && (
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icons.xCircle className="h-5 w-5 text-danger" />
                <span className="font-semibold text-danger">
                  Bloqueante ({blockingAlerts.length})
                </span>
              </div>
              <ul className="space-y-2">
                {blockingAlerts.map((alert) => (
                  <li key={alert.id} className="flex items-start gap-2">
                    <span className="text-danger mt-1">•</span>
                    <div className="flex-1">
                      <p className="text-sm text-danger">{alert.message}</p>
                      {alert.action && (
                        <p className="text-xs text-danger/70 mt-0.5">{alert.action}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning Alerts */}
          {warningAlerts.length > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icons.alertTriangle className="h-5 w-5 text-warning" />
                <span className="font-semibold text-warning">Revisar ({warningAlerts.length})</span>
              </div>
              <ul className="space-y-2">
                {warningAlerts.map((alert) => (
                  <li key={alert.id} className="flex items-start gap-2">
                    <span className="text-warning mt-1">•</span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{alert.message}</p>
                      {alert.action && (
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.action}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestion Alerts */}
          {suggestionAlerts.length > 0 && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icons.lightbulb className="h-5 w-5 text-success" />
                <span className="font-semibold text-success">
                  Sugerencias ({suggestionAlerts.length})
                </span>
              </div>
              <ul className="space-y-2">
                {suggestionAlerts.map((alert) => (
                  <li key={alert.id} className="flex items-start gap-2">
                    <span className="text-success mt-1">•</span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{alert.message}</p>
                      {alert.action && (
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.action}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex gap-3">
          <Button variant="secondary" onClick={onGoBack} disabled={isLoading} className="flex-1">
            <Icons.arrowLeft className="h-4 w-4 mr-2" />
            Corregir
          </Button>
          <Button
            variant={hasBlockingAlerts ? 'secondary' : 'primary'}
            onClick={onContinue}
            disabled={hasBlockingAlerts || isLoading}
            className="flex-1"
            title={
              hasBlockingAlerts
                ? 'Corrige los problemas bloqueantes antes de continuar'
                : 'Continuar a la vista previa'
            }
          >
            {hasBlockingAlerts ? (
              <>
                <Icons.lock className="h-4 w-4 mr-2" />
                Bloqueado
              </>
            ) : (
              <>
                Continuar
                <Icons.arrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
