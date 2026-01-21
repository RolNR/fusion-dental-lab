/**
 * Helper functions for OrderForm operations
 */

import { buildOrdersPath, buildOrderPath, buildOrderSubmitPath } from './paths';
import { OrderFormData } from '@/components/clinic-staff/order-form/OrderForm.types';

type RoleType = 'doctor' | 'assistant';

/**
 * Create a new order
 */
export async function createOrder(
  role: RoleType,
  formData: OrderFormData
): Promise<{ id: string }> {
  const response = await fetch(buildOrdersPath(role), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await response.json();
  if (!response.ok) {
    // Preserve validation error details if present
    if (data.details && Array.isArray(data.details)) {
      const error = new Error(data.error || 'Error al crear orden') as Error & {
        details: Array<{ path?: string[]; message?: string }>;
        error?: string;
      };
      error.details = data.details;
      error.error = data.error;
      throw error;
    }
    throw new Error(data.error || 'Error al crear orden');
  }

  return data.order;
}

/**
 * Update an existing order
 */
export async function updateOrder(
  role: RoleType,
  orderId: string,
  formData: OrderFormData
): Promise<void> {
  const response = await fetch(buildOrderPath(role, orderId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await response.json();
  if (!response.ok) {
    // Preserve validation error details if present
    if (data.details && Array.isArray(data.details)) {
      const error = new Error(data.error || 'Error al actualizar orden') as Error & {
        details: Array<{ path?: string[]; message?: string }>;
        error?: string;
      };
      error.details = data.details;
      error.error = data.error;
      throw error;
    }
    throw new Error(data.error || 'Error al actualizar orden');
  }
}

/**
 * Submit an order for review
 */
export async function submitOrderForReview(role: RoleType, orderId: string): Promise<void> {
  const response = await fetch(buildOrderSubmitPath(role, orderId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!response.ok) {
    // Preserve validation error details if present
    if (data.details && Array.isArray(data.details)) {
      const error = new Error(data.error || 'Error al enviar orden') as Error & {
        details: Array<{ path?: string[]; message?: string }>;
        error?: string;
      };
      error.details = data.details;
      error.error = data.error;
      throw error;
    }
    throw new Error(data.error || 'Error al enviar orden');
  }
}

/**
 * Handle successful order save navigation
 */
export function handleSuccessNavigation(
  onSuccess: (() => void) | undefined,
  router: { push: (path: string) => void; refresh: () => void },
  role: RoleType
): void {
  if (onSuccess) {
    onSuccess();
  } else {
    router.push(`/${role}/orders`);
    router.refresh();
  }
}
