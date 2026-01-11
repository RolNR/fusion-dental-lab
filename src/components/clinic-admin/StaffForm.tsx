'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';

interface StaffFormProps {
  initialData?: {
    name: string;
    email: string;
  };
  staffId?: string;
  staffType: 'doctor' | 'assistant';
  onSuccess?: () => void;
}

export function StaffForm({ initialData, staffId, staffType, onSuccess }: StaffFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const staffLabel = staffType === 'doctor' ? 'Doctor' : 'Asistente';
  const staffLabelPlural = staffType === 'doctor' ? 'Doctores' : 'Asistentes';
  const basePath = `/clinic-admin/${staffType === 'doctor' ? 'doctors' : 'assistants'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const url = staffId
        ? `/api/clinic-admin/${staffType === 'doctor' ? 'doctors' : 'assistants'}/${staffId}`
        : `/api/clinic-admin/${staffType === 'doctor' ? 'doctors' : 'assistants'}`;
      const method = staffId ? 'PATCH' : 'POST';

      const body: any = {
        name: formData.name,
        email: formData.email,
      };

      // Only include password if it's set (for creation or update)
      if (formData.password) {
        body.password = formData.password;
      } else if (!staffId) {
        setErrors({ password: 'La contraseña es requerida para crear un nuevo usuario' });
        setIsLoading(false);
        return;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((detail: { field: string; message: string }) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.error || `Error al guardar ${staffLabel.toLowerCase()}` });
        }
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(basePath);
        router.refresh();
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">{errors.general}</div>
      )}

      <Input
        label="Nombre Completo"
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
        placeholder="Juan Pérez"
      />

      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        required
        disabled={!!staffId}
        placeholder="juan@ejemplo.com"
      />

      <PasswordInput
        label={staffId ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
        name="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        required={!staffId}
        placeholder={staffId ? 'Dejar en blanco para mantener' : '••••••••'}
      />

      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading
            ? 'Guardando...'
            : staffId
              ? `Actualizar ${staffLabel}`
              : `Crear ${staffLabel}`}
        </Button>
      </div>
    </form>
  );
}
