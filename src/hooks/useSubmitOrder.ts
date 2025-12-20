import { useState } from 'react';

interface UseSubmitOrderOptions {
  role: 'assistant' | 'doctor';
}

interface UseSubmitOrderResult {
  submitOrder: (orderId: string, onSuccess?: () => void) => Promise<boolean>;
  submitting: boolean;
}

/**
 * Hook for submitting orders for review
 *
 * Handles the submission flow including:
 * - User confirmation
 * - API call to submit endpoint
 * - Success/error handling
 * - Loading state management
 */
export function useSubmitOrder({ role }: UseSubmitOrderOptions): UseSubmitOrderResult {
  const [submitting, setSubmitting] = useState(false);

  const submitOrder = async (orderId: string, onSuccess?: () => void): Promise<boolean> => {
    if (!confirm('¿Estás seguro de que quieres enviar esta orden para revisión?')) {
      return false;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/${role}/orders/${orderId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al enviar orden');
      }

      onSuccess?.();
      return true;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitOrder, submitting };
}
