import { Role } from '@prisma/client';

/**
 * Get the dashboard path for a given user role
 */
export function getRoleBasedRedirect(role: Role): string {
  switch (role) {
    case 'LAB_ADMIN':
      return '/lab-admin';
    case 'LAB_COLLABORATOR':
      return '/lab-collaborator';
    case 'CLINIC_ADMIN':
      return '/clinic-admin';
    case 'DOCTOR':
      return '/doctor';
    case 'CLINIC_ASSISTANT':
      return '/assistant';
    default:
      return '/unauthorized';
  }
}
