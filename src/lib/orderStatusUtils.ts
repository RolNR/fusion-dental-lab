import { OrderStatus } from '@prisma/client';

/**
 * Centralized order status utilities for consistent labeling and styling
 */

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Borrador',
  PENDING_REVIEW: 'Pendiente de Revisión',
  MATERIALS_SENT: 'Materiales Enviados',
  NEEDS_INFO: 'Necesita Información',
  IN_PROGRESS: 'En Proceso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PENDING_REVIEW: 'bg-info/10 text-info',
  MATERIALS_SENT: 'bg-primary/10 text-primary',
  NEEDS_INFO: 'bg-warning/10 text-warning',
  IN_PROGRESS: 'bg-info/10 text-info',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-danger/10 text-danger',
};

/**
 * Get the human-readable label for an order status
 */
export function getStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

/**
 * Get the Tailwind CSS classes for an order status badge
 */
export function getStatusColor(status: OrderStatus): string {
  return ORDER_STATUS_COLORS[status];
}

/**
 * Order statuses that can be edited
 */
export const EDITABLE_STATUSES: OrderStatus[] = [OrderStatus.DRAFT, OrderStatus.NEEDS_INFO];

/**
 * Check if an order with given status can be edited
 */
export function isOrderEditable(status: OrderStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}
