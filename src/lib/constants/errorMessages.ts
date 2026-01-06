/**
 * Centralized error messages for consistent UX
 */

export const AUTH_ERRORS = {
  NOT_AUTHENTICATED: 'No autenticado',
  NOT_AUTHORIZED: 'No autorizado',
  USER_NOT_FOUND: 'Usuario no encontrado',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  SESSION_EXPIRED: 'Sesión expirada',
} as const;

export const PROFILE_ERRORS = {
  UPDATE_FAILED: 'Error al actualizar el perfil',
  EMAIL_IN_USE: 'Este correo electrónico ya está en uso',
  INVALID_CURRENT_PASSWORD: 'La contraseña actual es incorrecta',
  PASSWORD_CHANGE_FAILED: 'Error al cambiar la contraseña',
} as const;

export const VALIDATION_ERRORS = {
  VALIDATION_FAILED: 'Validación fallida',
  REQUIRED_FIELD: 'Este campo es requerido',
  INVALID_EMAIL: 'Formato de correo inválido',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
} as const;

export const GENERIC_ERRORS = {
  INTERNAL_SERVER_ERROR: 'Error interno del servidor',
  UNKNOWN_ERROR: 'Error desconocido',
  NETWORK_ERROR: 'Error de conexión',
} as const;

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Perfil actualizado exitosamente',
  PASSWORD_CHANGED: 'Contraseña cambiada exitosamente',
  USER_CREATED: 'Usuario creado exitosamente',
  USER_UPDATED: 'Usuario actualizado exitosamente',
} as const;
