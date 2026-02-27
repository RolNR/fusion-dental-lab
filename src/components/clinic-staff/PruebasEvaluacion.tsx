'use client';

import { useState } from 'react';
import { TrialType } from '@prisma/client';
import { PruebaRecord } from '@/types/order';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Icons } from '@/components/ui/Icons';

const TIPO_LABELS: Record<TrialType, string> = {
  estructura: 'Prueba de Estructura',
  biscocho: 'Prueba de Biscocho',
  estetica: 'Prueba Estética',
  encerado: 'Prueba de Encerado',
  oclusion: 'Prueba de Oclusión',
  altura_dvo: 'Prueba de Altura / DVO',
  color: 'Verificación de Color',
  encaje: 'Prueba de Encaje',
  rodetes: 'Prueba de Rodetes',
  dientes: 'Prueba de Dientes',
  provisional: 'Prueba de Provisional',
  alineacion: 'Prueba de Alineación',
  metal: 'Prueba de Metal',
  implante: 'Verificación de Implante',
};

interface PruebasEvaluacionProps {
  orderId: string;
  pruebas: PruebaRecord[];
  onResponded: () => void;
}

interface EvalState {
  submitting: boolean;
  showRejectForm: boolean;
  notasCliente: string;
  error: string | null;
}

const defaultEval: EvalState = {
  submitting: false,
  showRejectForm: false,
  notasCliente: '',
  error: null,
};

export function PruebasEvaluacion({ orderId, pruebas, onResponded }: PruebasEvaluacionProps) {
  const pending = pruebas.filter((p) => !p.completada);
  const [evalStates, setEvalStates] = useState<Record<string, EvalState>>({});

  if (pending.length === 0) return null;

  const getState = (id: string): EvalState => evalStates[id] ?? defaultEval;

  const setState = (id: string, patch: Partial<EvalState>) =>
    setEvalStates((prev) => ({ ...prev, [id]: { ...(prev[id] ?? defaultEval), ...patch } }));

  const handleRespond = async (pruebaId: string, aprobada: boolean, notasCliente?: string) => {
    setState(pruebaId, { submitting: true, error: null });
    try {
      const response = await fetch(`/api/doctor/orders/${orderId}/pruebas/${pruebaId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobada, notasCliente }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al registrar evaluación');
      }
      onResponded();
    } catch (err) {
      setState(pruebaId, {
        submitting: false,
        error: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  };

  const handleApprove = (pruebaId: string) => handleRespond(pruebaId, true);

  const handleRejectSubmit = (pruebaId: string) => {
    const state = getState(pruebaId);
    if (!state.notasCliente.trim()) {
      setState(pruebaId, { error: 'Indica el motivo del rechazo' });
      return;
    }
    handleRespond(pruebaId, false, state.notasCliente);
  };

  return (
    <div className="mt-6 rounded-xl border-2 border-warning/40 bg-warning/5 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <Icons.alertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {pending.length === 1
              ? 'Prueba pendiente de evaluación'
              : `${pending.length} pruebas pendientes de evaluación`}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            El laboratorio requiere tu evaluación para continuar con el caso.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {pending.map((prueba) => {
          const state = getState(prueba.id);
          return (
            <div
              key={prueba.id}
              className="rounded-lg bg-background border border-border p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Icons.clipboardCheck className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{TIPO_LABELS[prueba.tipo]}</span>
              </div>

              {prueba.nota && (
                <p className="text-sm text-muted-foreground bg-muted/40 rounded p-2">
                  {prueba.nota}
                </p>
              )}

              {state.error && (
                <div className="rounded-md bg-danger/10 p-2">
                  <p className="text-xs text-danger">{state.error}</p>
                </div>
              )}

              {!state.showRejectForm ? (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(prueba.id)}
                    isLoading={state.submitting}
                    disabled={state.submitting}
                    className="flex-1"
                  >
                    <Icons.check size={14} className="mr-1.5" />
                    Aprobar prueba
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setState(prueba.id, { showRejectForm: true, error: null })}
                    disabled={state.submitting}
                    className="flex-1"
                  >
                    <Icons.x size={14} className="mr-1.5" />
                    Rechazar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    id={`notas-${prueba.id}`}
                    label="Motivo del rechazo"
                    required
                    value={state.notasCliente}
                    onChange={(e) =>
                      setState(prueba.id, { notasCliente: e.target.value, error: null })
                    }
                    placeholder="Describe los ajustes o correcciones necesarias..."
                    rows={3}
                    error={state.error ?? undefined}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRejectSubmit(prueba.id)}
                      isLoading={state.submitting}
                      disabled={state.submitting || !state.notasCliente.trim()}
                      className="flex-1"
                    >
                      Confirmar rechazo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setState(prueba.id, {
                          showRejectForm: false,
                          notasCliente: '',
                          error: null,
                        })
                      }
                      disabled={state.submitting}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
