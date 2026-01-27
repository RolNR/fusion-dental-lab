'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Role } from '@prisma/client';

interface UserFormProps {
  initialData?: {
    name?: string;
    email?: string;
    role?: Role;
    phone?: string;
    clinicName?: string;
    clinicAddress?: string;
    razonSocial?: string;
    fiscalAddress?: string;
  };
  userId?: string;
  roleFixed?: boolean;
  onSuccess?: () => void;
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  clinicName?: string;
  clinicAddress?: string;
  razonSocial?: string;
  fiscalAddress?: string;
}

interface UpdateUserPayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  clinicName?: string;
  clinicAddress?: string;
  razonSocial?: string;
  fiscalAddress?: string;
}

export function UserForm({ initialData, userId, roleFixed = false, onSuccess }: UserFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || ('DOCTOR' as Role),
    phone: initialData?.phone || '',
    clinicName: initialData?.clinicName || '',
    clinicAddress: initialData?.clinicAddress || '',
    razonSocial: initialData?.razonSocial || '',
    fiscalAddress: initialData?.fiscalAddress || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const url = userId ? `/api/lab-admin/users/${userId}` : '/api/lab-admin/users';
      const method = userId ? 'PATCH' : 'POST';

      let payload: CreateUserPayload | UpdateUserPayload;

      if (!userId) {
        const createPayload: CreateUserPayload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role as Role,
        };

        if (formData.role === 'DOCTOR') {
          createPayload.phone = formData.phone || undefined;
          createPayload.clinicName = formData.clinicName || undefined;
          createPayload.clinicAddress = formData.clinicAddress || undefined;
          createPayload.razonSocial = formData.razonSocial || undefined;
          createPayload.fiscalAddress = formData.fiscalAddress || undefined;
        }

        payload = createPayload;
      } else {
        const updatePayload: UpdateUserPayload = {
          name: formData.name,
          email: formData.email,
        };

        if (formData.password) {
          updatePayload.password = formData.password;
        }

        if (initialData?.role === 'DOCTOR') {
          updatePayload.phone = formData.phone || undefined;
          updatePayload.clinicName = formData.clinicName || undefined;
          updatePayload.clinicAddress = formData.clinicAddress || undefined;
          updatePayload.razonSocial = formData.razonSocial || undefined;
          updatePayload.fiscalAddress = formData.fiscalAddress || undefined;
        }

        payload = updatePayload;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          setErrors({ general: data.error || 'Error al guardar usuario' });
        }
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/lab-admin/users');
        router.refresh();
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const isDoctor = formData.role === 'DOCTOR' || initialData?.role === 'DOCTOR';

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
        disabled={!!userId}
        placeholder="juan@ejemplo.com"
      />

      {!userId && !roleFixed && (
        <input type="hidden" name="role" value="DOCTOR" />
      )}

      {!userId && roleFixed && formData.role && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Rol</label>
          <p className="text-sm text-muted-foreground">Doctor</p>
        </div>
      )}

      <PasswordInput
        label={userId ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
        name="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        required={!userId}
        placeholder="Mínimo 8 caracteres"
      />

      {/* Doctor Profile Fields */}
      {isDoctor && (
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-foreground">Información del Consultorio</h3>

          <Input
            label="Teléfono"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
            placeholder="(123) 456-7890"
          />

          <Input
            label="Nombre del Consultorio"
            name="clinicName"
            value={formData.clinicName}
            onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
            error={errors.clinicName}
            placeholder="Consultorio Dental Pérez"
          />

          <Input
            label="Dirección del Consultorio"
            name="clinicAddress"
            value={formData.clinicAddress}
            onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
            error={errors.clinicAddress}
            placeholder="Av. Principal 123, Col. Centro"
          />

          <Input
            label="Razón Social"
            name="razonSocial"
            value={formData.razonSocial}
            onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
            error={errors.razonSocial}
            placeholder="Razón social para facturación"
          />

          <Input
            label="Dirección Fiscal"
            name="fiscalAddress"
            value={formData.fiscalAddress}
            onChange={(e) => setFormData({ ...formData, fiscalAddress: e.target.value })}
            error={errors.fiscalAddress}
            placeholder="Dirección fiscal para facturación"
          />
        </div>
      )}

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
          {isLoading ? 'Guardando...' : userId ? 'Actualizar Usuario' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
}
