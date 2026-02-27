'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrialType } from '@prisma/client';
import { PruebaRecord } from '@/types/order';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Icons } from '@/components/ui/Icons';
import { formatDate } from '@/lib/formatters';

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

// Color semantic tokens per trial category
const TIPO_COLOR_CLASS: Record<TrialType, string> = {
  estructura: 'bg-warning/10 text-warning',
  metal: 'bg-warning/10 text-warning',
  biscocho: 'bg-primary/10 text-primary',
  estetica: 'bg-primary/10 text-primary',
  color: 'bg-primary/10 text-primary',
  encerado: 'bg-muted text-muted-foreground',
  oclusion: 'bg-muted text-muted-foreground',
  encaje: 'bg-muted text-muted-foreground',
  altura_dvo: 'bg-warning/10 text-warning',
  rodetes: 'bg-muted text-muted-foreground',
  dientes: 'bg-muted text-muted-foreground',
  provisional: 'bg-muted text-muted-foreground',
  alineacion: 'bg-muted text-muted-foreground',
  implante: 'bg-muted text-muted-foreground',
};

const TIPO_DOT_BG: Record<TrialType, string> = {
  estructura: 'bg-warning',
  metal: 'bg-warning',
  biscocho: 'bg-primary',
  estetica: 'bg-primary',
  color: 'bg-primary',
  encerado: 'bg-border',
  oclusion: 'bg-border',
  encaje: 'bg-border',
  altura_dvo: 'bg-warning',
  rodetes: 'bg-border',
  dientes: 'bg-border',
  provisional: 'bg-border',
  alineacion: 'bg-border',
  implante: 'bg-border',
};

interface HistoricoPruebasProps {
  orderId: string;
}

interface FormState {
  tipo: TrialType;
  nota: string;
  completada: boolean;
}

const defaultForm: FormState = {
  tipo: TrialType.estructura,
  nota: '',
  completada: true,
};

export function HistoricoPruebas({ orderId }: HistoricoPruebasProps) {
  const [pruebas, setPruebas] = useState<PruebaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchPruebas = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/lab-admin/orders/${orderId}/pruebas`);
      if (!response.ok) throw new Error('Error al cargar historial');
      const data = await response.json();
      setPruebas(data.pruebas);
    } catch {
      setError('Error al cargar el historial de pruebas');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchPruebas();
  }, [fetchPruebas]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/lab-admin/orders/${orderId}/pruebas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al registrar prueba');
      }
      setForm(defaultForm);
      setShowForm(false);
      await fetchPruebas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkComplete = async (pruebaId: string) => {
    setCompletingId(pruebaId);
    setError(null);
    try {
      const response = await fetch(`/api/lab-admin/orders/${orderId}/pruebas/${pruebaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada: true }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar prueba');
      }
      await fetchPruebas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCompletingId(null);
    }
  };

  const handleDelete = async (pruebaId: string) => {
    setDeletingId(pruebaId);
    setError(null);
    try {
      const response = await fetch(`/api/lab-admin/orders/${orderId}/pruebas/${pruebaId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar prueba');
      }
      await fetchPruebas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Icons.spinner className="h-4 w-4 animate-spin" />
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-danger/10 p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Timeline */}
      {pruebas.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">Sin pruebas registradas aún.</p>
      )}

      {pruebas.length > 0 && (
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-border" />

          <ul className="space-y-3">
            {pruebas.map((prueba) => (
              <li key={prueba.id} className="relative flex gap-3 pl-8">
                {/* Dot */}
                <div
                  className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    !prueba.completada
                      ? 'bg-background border-primary'
                      : prueba.aprobada === true
                        ? 'bg-success border-transparent'
                        : prueba.aprobada === false
                          ? 'bg-danger border-transparent'
                          : `${TIPO_DOT_BG[prueba.tipo]} border-transparent`
                  }`}
                >
                  {!prueba.completada && <Icons.clock size={11} className="text-primary" />}
                  {prueba.completada && prueba.aprobada !== false && (
                    <Icons.check size={11} className="text-white" />
                  )}
                  {prueba.completada && prueba.aprobada === false && (
                    <Icons.x size={11} className="text-white" />
                  )}
                </div>

                {/* Card */}
                <div className="flex-1 min-w-0 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Type badge */}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${TIPO_COLOR_CLASS[prueba.tipo]}`}
                      >
                        {TIPO_LABELS[prueba.tipo]}
                      </span>

                      {/* Status line */}
                      <div>
                        {!prueba.completada && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                            <Icons.clock size={11} />
                            En prueba — pendiente de evaluación
                          </span>
                        )}
                        {prueba.completada && prueba.aprobada === true && (
                          <span className="text-xs text-success font-medium">
                            ✓ Aprobada por cliente ·{' '}
                            {formatDate(prueba.respondidaAt ?? prueba.registradaAt!, true)}
                          </span>
                        )}
                        {prueba.completada && prueba.aprobada === false && (
                          <span className="text-xs text-danger font-medium">
                            ✗ Rechazada por cliente ·{' '}
                            {formatDate(prueba.respondidaAt ?? prueba.registradaAt!, true)}
                          </span>
                        )}
                        {prueba.completada && prueba.aprobada === null && (
                          <span className="text-xs text-muted-foreground font-medium">
                            Regresó al laboratorio · {formatDate(prueba.registradaAt!, true)}
                          </span>
                        )}
                      </div>

                      {/* Note */}
                      {prueba.nota && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {prueba.nota}
                        </p>
                      )}

                      {/* Client rejection notes */}
                      {prueba.completada && prueba.aprobada === false && prueba.notasCliente && (
                        <div className="rounded bg-danger/10 border border-danger/20 px-2 py-1">
                          <p className="text-xs text-danger leading-relaxed">
                            <span className="font-medium">Motivo de rechazo: </span>
                            {prueba.notasCliente}
                          </p>
                        </div>
                      )}

                      {/* Registered by */}
                      <p className="text-xs text-muted-foreground/60">
                        {prueba.createdBy?.name} · {formatDate(prueba.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                      {!prueba.completada && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkComplete(prueba.id)}
                          disabled={completingId === prueba.id}
                          title="El caso regresó — marcar prueba como completada"
                          className="h-9 w-9 p-0 text-success hover:bg-success/10"
                        >
                          {completingId === prueba.id ? (
                            <Icons.spinner size={18} className="animate-spin" />
                          ) : (
                            <Icons.check size={18} />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prueba.id)}
                        disabled={deletingId === prueba.id}
                        title="Eliminar"
                        className="h-9 w-9 p-0 text-danger hover:bg-danger/10"
                      >
                        {deletingId === prueba.id ? (
                          <Icons.spinner size={18} className="animate-spin" />
                        ) : (
                          <Icons.trash size={18} />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <Select
            id="tipo-prueba"
            label="Tipo de prueba"
            required
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as TrialType })}
          >
            {(Object.entries(TIPO_LABELS) as [TrialType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Textarea
            id="nota-prueba"
            label="Nota (opcional)"
            value={form.nota}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
            placeholder="Detalles sobre esta prueba..."
            rows={2}
          />

          <div className="rounded-md bg-muted/40 border border-border p-3 space-y-1">
            <div className="flex items-center gap-2">
              <input
                id="completada-prueba"
                type="checkbox"
                checked={form.completada}
                onChange={(e) => setForm({ ...form, completada: e.target.checked })}
                className="h-4 w-4 rounded border-border-input text-primary focus:ring-primary/20"
              />
              <label
                htmlFor="completada-prueba"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                El caso ya regresó de esta prueba
              </label>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {form.completada
                ? 'El caso regresó al laboratorio tras la prueba.'
                : 'El caso está en prueba o aún no ha salido — pendiente de retorno.'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              Guardar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setForm(defaultForm);
                setError(null);
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)} className="w-full">
          <Icons.plus size={14} className="mr-1.5" />
          Registrar prueba
        </Button>
      )}
    </div>
  );
}
