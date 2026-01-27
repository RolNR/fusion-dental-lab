/**
 * Centralized formatting utilities
 */

/**
 * Format bytes to human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Standard date formatting options for Spanish locale
 */
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

export const DATETIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

/**
 * Format date to Spanish locale
 */
export function formatDate(date: string | Date, includeTime = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const options = includeTime ? DATETIME_FORMAT_OPTIONS : DATE_FORMAT_OPTIONS;
  return dateObj.toLocaleDateString('es-MX', options);
}

/**
 * Translate user role to Spanish display label
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    LAB_ADMIN: 'Admin Laboratorio',
    DOCTOR: 'Doctor',
  };
  return labels[role] || role;
}
