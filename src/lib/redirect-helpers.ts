import { Role } from '@prisma/client';

/**
 * Get the dashboard path for a given user role
 */
export function getRoleBasedRedirect(role: Role): string {
  switch (role) {
    case 'LAB_ADMIN':
      return '/lab-admin/orders';
    case 'DOCTOR':
      return '/doctor';
    default:
      return '/unauthorized';
  }
}
