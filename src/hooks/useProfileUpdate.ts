import { useState } from 'react';
import { ProfileUpdateInput } from '@/lib/schemas/userSchemas';

interface UseProfileUpdateResult {
  updateProfile: (data: ProfileUpdateInput) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Custom hook for updating user profile
 * Handles API calls, loading state, and error/success messages
 */
export function useProfileUpdate(): UseProfileUpdateResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateProfile = async (data: ProfileUpdateInput): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar el perfil');
      }

      setSuccess(result.message || 'Perfil actualizado exitosamente');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Error desconocido al actualizar el perfil';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProfile, isLoading, error, success };
}
