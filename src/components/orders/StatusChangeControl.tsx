'use client';

import { useState } from 'react';
import { OrderStatus, Role } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { getValidNextStatesForRole } from '@/lib/orderStateMachine';
import { getStatusLabel } from '@/lib/orderStatusUtils';
import { Textarea } from '@/components/ui/Textarea';

interface StatusChangeControlProps {
  orderId: string;
  currentStatus: OrderStatus;
  userRole: Role;
  onStatusChange: () => void;
}

export function StatusChangeControl({
  orderId,
  currentStatus,
  userRole,
  onStatusChange,
}: StatusChangeControlProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validNextStates = getValidNextStatesForRole(userRole, currentStatus);
  const requiresComment = selectedStatus === OrderStatus.NEEDS_INFO;

  const handleOpenConfirmation = () => {
    if (!selectedStatus) return;
    if (requiresComment && !comment.trim()) {
      setError('Debes proporcionar un comentario cuando solicitas información');
      return;
    }
    setError(null);
    setShowConfirmModal(true);
  };

  const handleConfirmedStatusChange = async () => {
    if (!selectedStatus) return;
    if (requiresComment && !comment.trim()) {
      setError('Debes proporcionar un comentario cuando solicitas información');
      setShowConfirmModal(false);
      return;
    }

    setShowConfirmModal(false);
    setIsChanging(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const body: { status: OrderStatus; comment?: string } = { status: selectedStatus };
      if (requiresComment) {
        body.comment = comment.trim();
      }

      const response = await fetch(`/api/lab-admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar el estado');
      }

      setSelectedStatus(null);
      setComment('');
      setSuccessMessage('Estado actualizado exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      onStatusChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsChanging(false);
    }
  };

  if (validNextStates.length === 0) {
    return null;
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Revisar</h3>

        <div className="space-y-4">
          <Select
            id="status-select"
            label="Nuevo Estado"
            value={selectedStatus || ''}
            onChange={(e) => {
              setSelectedStatus(e.target.value as OrderStatus || null);
              setError(null);
            }}
            disabled={isChanging}
            error={error || undefined}
          >
            <option value="">Seleccionar estado...</option>
            {validNextStates.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </Select>

          {requiresComment && (
            <Textarea
              id="comment"
              label="Información requerida"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError(null);
              }}
              placeholder="Describe qué información adicional necesitas..."
              disabled={isChanging}
              required
              rows={4}
            />
          )}

          {successMessage && (
            <div
              className="rounded-lg bg-success/10 p-4 text-success border border-success/20"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleOpenConfirmation}
            disabled={!selectedStatus || (requiresComment && !comment.trim())}
            isLoading={isChanging}
            className="w-full"
            aria-label="Enviar cambio de estado"
          >
            Enviar
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar cambio de estado"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-foreground break-words">
            ¿Estás seguro de que quieres cambiar el estado a{' '}
            <span className="font-semibold">
              {selectedStatus && getStatusLabel(selectedStatus)}
            </span>
            ?
          </p>
          {requiresComment && comment && (
            <div className="rounded-lg bg-muted p-3 border border-border break-words">
              <p className="text-sm font-medium text-foreground mb-1">Comentario:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{comment}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              onClick={handleConfirmedStatusChange}
              className="w-full sm:flex-1"
            >
              Confirmar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              className="w-full sm:flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
