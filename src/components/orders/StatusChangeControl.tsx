'use client';

import { useState } from 'react';
import { OrderStatus, Role } from '@prisma/client';
import { Button } from '@/components/ui/Button';
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

// Get custom button styling based on status
function getStatusButtonStyles(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.IN_PROGRESS:
      return 'bg-success/10 text-success hover:bg-success/20 border border-success/30';
    case OrderStatus.COMPLETED:
      return 'bg-success/20 text-success hover:bg-success/30 border-2 border-success font-bold';
    case OrderStatus.NEEDS_INFO:
      return 'bg-warning/10 text-warning hover:bg-warning/20 border border-warning/30';
    case OrderStatus.CANCELLED:
      return 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30';
    default:
      return 'bg-secondary/10 text-secondary hover:bg-secondary/20 border border-border';
  }
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
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validNextStates = getValidNextStatesForRole(userRole, currentStatus);
  const requiresComment = selectedStatus === OrderStatus.NEEDS_INFO;

  const handleStatusButtonClick = (status: OrderStatus) => {
    setSelectedStatus(status);
    setError(null);

    // If NEEDS_INFO, show comment input
    if (status === OrderStatus.NEEDS_INFO) {
      setShowCommentInput(true);
    } else {
      // Otherwise, directly show confirmation modal
      setShowConfirmModal(true);
    }
  };

  const handleSubmitWithComment = () => {
    if (!comment.trim()) {
      setError('Debes proporcionar un comentario cuando solicitas información');
      return;
    }
    setError(null);
    setShowCommentInput(false);
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
      setShowCommentInput(false);
      setSuccessMessage('Estado actualizado exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      onStatusChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsChanging(false);
    }
  };

  const handleCancelComment = () => {
    setShowCommentInput(false);
    setSelectedStatus(null);
    setComment('');
    setError(null);
  };

  if (validNextStates.length === 0) {
    return null;
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Revisar</h3>

        {successMessage && (
          <div
            className="rounded-lg bg-success/10 p-4 text-success border border-success/20 mb-4"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {error && !showCommentInput && (
          <div className="rounded-lg bg-danger/10 p-4 text-danger border border-danger/20 mb-4">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!showCommentInput ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-3">
              Selecciona una acción para continuar:
            </p>
            {validNextStates.map((status) => (
              <Button
                key={status}
                variant="ghost"
                onClick={() => handleStatusButtonClick(status)}
                disabled={isChanging}
                className={`w-full justify-start ${getStatusButtonStyles(status)}`}
              >
                {getStatusLabel(status)}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
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
              error={error || undefined}
            />
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleSubmitWithComment}
                disabled={!comment.trim()}
                className="flex-1"
              >
                Continuar
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancelComment}
                disabled={isChanging}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
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
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {comment}
              </p>
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
