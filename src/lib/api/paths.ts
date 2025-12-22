/**
 * Centralized API path construction utilities
 */

type RoleType = 'doctor' | 'assistant' | 'lab-admin' | 'clinic-admin';

/**
 * Build API path for orders collection
 */
export function buildOrdersPath(role: RoleType): string {
  return `/api/${role}/orders`;
}

/**
 * Build API path for a specific order
 */
export function buildOrderPath(role: RoleType, orderId: string): string {
  return `/api/${role}/orders/${orderId}`;
}

/**
 * Build API path for submitting an order
 */
export function buildOrderSubmitPath(role: RoleType, orderId: string): string {
  return `/api/${role}/orders/${orderId}/submit`;
}

/**
 * Build API path for order status update
 */
export function buildOrderStatusPath(role: RoleType, orderId: string): string {
  return `/api/${role}/orders/${orderId}/status`;
}
