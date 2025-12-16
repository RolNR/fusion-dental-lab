import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

/**
 * Get the current session or redirect to login
 * Use this in Server Components or Server Actions
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return session;
}

/**
 * Require specific role(s) or redirect to unauthorized page
 * Use this in Server Components or Server Actions
 *
 * @param allowedRoles - Array of roles that are allowed to access
 */
export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Get the current user session without redirecting
 * Returns null if not authenticated
 * Use this when you want to optionally show different content based on auth state
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Check if user has a specific role
 * Returns false if not authenticated
 */
export async function hasRole(role: Role) {
  const session = await getServerSession(authOptions);
  return session?.user?.role === role;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  return !!session;
}
