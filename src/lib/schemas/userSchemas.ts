import { z } from 'zod';

/**
 * Shared Zod schemas for user validation
 * Used on both frontend and backend for consistent validation
 */

// Individual field schemas
export const nameSchema = z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim();

export const emailSchema = z.string().email('Formato de correo inválido').trim();

export const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres');

// Profile update schema (name and email only)
export const profileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
});

// Type inference
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// User registration schema
export const userRegistrationSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;

// Password change schema
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
