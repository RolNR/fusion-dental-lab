'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { useProfileUpdate } from '@/hooks/useProfileUpdate';
import { profileUpdateSchema, passwordChangeSchema } from '@/lib/schemas/userSchemas';
import { z } from 'zod';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface ProfileSettingsFormProps {
  user: User;
}

interface FormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { updateProfile, isLoading, error, success } = useProfileUpdate();
  const [formData, setFormData] = useState<FormData>({
    name: user.name || '',
    email: user.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const validateForm = (): boolean => {
    const allErrors: FormErrors = {};

    // Validate profile data using Zod
    const profileData = {
      name: formData.name,
      email: formData.email,
      ...(isChangingPassword && {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }),
    };

    const profileResult = profileUpdateSchema.safeParse(profileData);
    if (!profileResult.success) {
      profileResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormErrors;
        allErrors[field] = issue.message;
      });
    }

    // Validate password confirmation if changing password
    if (isChangingPassword) {
      const passwordData = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      };

      const passwordResult = passwordChangeSchema.safeParse(passwordData);
      if (!passwordResult.success) {
        passwordResult.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof FormErrors;
          allErrors[field] = issue.message;
        });
      }
    }

    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload: {
      name: string;
      email: string;
      currentPassword?: string;
      newPassword?: string;
    } = {
      name: formData.name,
      email: formData.email,
    };

    // Only include password fields if changing password
    if (isChangingPassword) {
      payload.currentPassword = formData.currentPassword;
      payload.newPassword = formData.newPassword;
    }

    const updated = await updateProfile(payload);

    if (updated) {
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);

      // Update session with new user data
      await updateSession();

      // Refresh the page to update session data
      router.refresh();
    }
  };

  return (
    <div className="rounded-lg bg-background p-6 shadow border border-border">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="rounded-md bg-success/10 p-4 flex items-start gap-3">
            <Icons.check className="h-5 w-5 text-success mt-0.5" />
            <p className="text-sm text-success">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-danger/10 p-4 flex items-start gap-3">
            <Icons.alertCircle className="h-5 w-5 text-danger mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Información Básica</h2>

          <Input
            label="Nombre completo"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="Tu nombre completo"
          />

          <Input
            label="Correo electrónico"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            placeholder="tu@ejemplo.com"
          />
        </div>

        {/* Password Change Section */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Cambiar Contraseña</h2>
            <button
              type="button"
              onClick={() => {
                setIsChangingPassword(!isChangingPassword);
                if (isChangingPassword) {
                  // Clear password fields when canceling
                  setFormData({
                    ...formData,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setErrors({});
                }
              }}
              className="text-sm text-primary hover:underline"
            >
              {isChangingPassword ? 'Cancelar' : 'Cambiar contraseña'}
            </button>
          </div>

          {isChangingPassword && (
            <div className="space-y-4">
              <PasswordInput
                label="Contraseña actual"
                required
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                error={errors.currentPassword}
                placeholder="Tu contraseña actual"
              />

              <PasswordInput
                label="Nueva contraseña"
                required
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                error={errors.newPassword}
                placeholder="Mínimo 8 caracteres"
              />

              <PasswordInput
                label="Confirmar nueva contraseña"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                error={errors.confirmPassword}
                placeholder="Repite tu nueva contraseña"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
