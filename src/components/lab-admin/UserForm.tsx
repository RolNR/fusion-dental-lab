'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { Role } from '@prisma/client';

interface UserFormProps {
  initialData?: {
    name?: string;
    email?: string;
    role?: Role;
  };
  userId?: string;
  roleFixed?: boolean;
  initialClinicId?: string;
  onSuccess?: () => void;
}

type Clinic = {
  id: string;
  name: string;
};

export function UserForm({ initialData, userId, roleFixed = false, initialClinicId, onSuccess }: UserFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || ('' as Role | ''),
    clinicId: initialClinicId || '',
  });
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch clinics for dropdown
  useEffect(() => {
    async function fetchClinics() {
      try {
        const response = await fetch('/api/lab-admin/clinics');
        if (response.ok) {
          const data = await response.json();
          setClinics(data.clinics);
        }
      } catch (error) {
        console.error('Error fetching clinics:', error);
      }
    }
    fetchClinics();
  }, []);

  const requiresClinic = (role: Role | '') => {
    return (
      role === 'CLINIC_ADMIN' ||
      role === 'DOCTOR' ||
      role === 'CLINIC_ASSISTANT'
    );
  };

  const getRoleDisplayName = (role: Role | ''): string => {
    switch (role) {
      case 'DOCTOR':
        return 'doctor';
      case 'CLINIC_ADMIN':
        return 'administrador de clínica';
      case 'CLINIC_ASSISTANT':
        return 'asistente';
      default:
        return 'usuario';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const url = userId ? `/api/lab-admin/users/${userId}` : '/api/lab-admin/users';
      const method = userId ? 'PATCH' : 'POST';

      const payload: any = {
        name: formData.name,
        email: formData.email,
      };

      if (!userId) {
        // Only include these on creation
        payload.password = formData.password;
        payload.role = formData.role;

        if (requiresClinic(formData.role)) {
          payload.clinicId = formData.clinicId;
        }
      } else if (formData.password) {
        // Only include password on update if it's being changed
        payload.password = formData.password;
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
          {errors.general}
        </div>
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
        <Select
          label="Rol"
          name="role"
          value={formData.role}
          onChange={(e) =>
            setFormData({ ...formData, role: e.target.value as Role })
          }
          error={errors.role}
          required
        >
          <option value="">Selecciona un rol</option>
          <option value="LAB_COLLABORATOR">Colaborador del Laboratorio</option>
          <option value="CLINIC_ADMIN">Administrador de Clínica</option>
          <option value="DOCTOR">Doctor</option>
          <option value="CLINIC_ASSISTANT">Asistente de Clínica</option>
        </Select>
      )}

      {!userId && roleFixed && formData.role && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Rol
          </label>
          <p className="text-sm text-muted-foreground">
            Colaborador del Laboratorio
          </p>
        </div>
      )}

      {!userId && requiresClinic(formData.role) && (
        <>
          {clinics.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-warning bg-warning/5 p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Icons.alertCircle className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    No hay clínicas disponibles
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Para agregar un {getRoleDisplayName(formData.role)}, primero necesitas crear una clínica.
                  </p>
                  <Link href="/lab-admin/clinics/new">
                    <Button variant="primary" size="sm">
                      Crear Clínica
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <Select
              label="Clínica"
              name="clinicId"
              value={formData.clinicId}
              onChange={(e) =>
                setFormData({ ...formData, clinicId: e.target.value })
              }
              error={errors.clinicId}
              required
            >
              <option value="">Selecciona una clínica</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </Select>
          )}
        </>
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
            : userId
              ? 'Actualizar Usuario'
              : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
}
