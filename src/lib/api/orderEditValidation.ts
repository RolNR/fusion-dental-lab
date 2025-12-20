import { OrderStatus } from '@prisma/client';

/**
 * Checks if an order can be edited based on its current status
 *
 * Orders can be edited when they are:
 * - DRAFT: Initial state, not yet submitted
 * - NEEDS_INFO: Lab requested more information from clinic
 *
 * @param status - Current order status
 * @returns Object with canEdit flag and optional error message
 */
export function canEditOrder(status: OrderStatus): {
  canEdit: boolean;
  error?: string;
} {
  const editableStatuses: OrderStatus[] = [OrderStatus.DRAFT, OrderStatus.NEEDS_INFO];

  if (!editableStatuses.includes(status)) {
    return {
      canEdit: false,
      error: 'Solo se pueden editar órdenes en borrador o que necesitan información',
    };
  }

  return {
    canEdit: true,
  };
}

/**
 * Checks if an order can be deleted based on its current status
 *
 * Orders can only be deleted when they are:
 * - DRAFT: Not yet submitted to lab
 *
 * @param status - Current order status
 * @returns Object with canDelete flag and optional error message
 */
export function canDeleteOrder(status: OrderStatus): {
  canDelete: boolean;
  error?: string;
} {
  if (status !== OrderStatus.DRAFT) {
    return {
      canDelete: false,
      error: 'Solo se pueden eliminar órdenes en borrador',
    };
  }

  return {
    canDelete: true,
  };
}
