'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ClinicFormData } from '@/types/clinic';

interface ClinicFormProps {
  initialData?: ClinicFormData;
  clinicId?: string;
  onSuccess?: () => void;
}

export function ClinicForm({ initialData, clinicId, onSuccess }: ClinicFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const url = clinicId
        ? `/api/lab-admin/clinics/${clinicId}`
        : '/api/lab-admin/clinics';
      const method = clinicId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
        }),
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
          setErrors({ general: data.error || 'Error al guardar clínica' });
        }
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/lab-admin/clinics');
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
        label="Nombre de la Clínica"
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
        placeholder="Clínica Dental Ejemplo"
      />

      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        placeholder="contacto@clinica.com"
      />

      <Input
        label="Teléfono"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        error={errors.phone}
        placeholder="+52 123 456 7890"
      />

      <Input
        label="Dirección"
        name="address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        error={errors.address}
        placeholder="Calle Principal #123, Ciudad"
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
            : clinicId
              ? 'Actualizar Clínica'
              : 'Crear Clínica'}
        </Button>
      </div>
    </form>
  );
}
