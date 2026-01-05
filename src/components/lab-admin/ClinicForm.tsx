'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ClinicFormData } from '@/types/clinic';

interface ClinicFormProps {
  initialData?: ClinicFormData;
  clinicId?: string;
  onSuccess?: (createdClinicId?: string) => void;
  asModal?: boolean;
  onCancel?: () => void;
}

interface ClinicApiResponse {
  message: string;
  clinic: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
}

interface ErrorApiResponse {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export function ClinicForm({ initialData, clinicId, onSuccess, asModal = false, onCancel }: ClinicFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const submitForm = async () => {
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

      if (!response.ok) {
        const errorData: ErrorApiResponse = await response.json();
        if (errorData.details) {
          const fieldErrors: Record<string, string> = {};
          errorData.details.forEach((detail) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: errorData.error || 'Error al guardar clínica' });
        }
        return;
      }

      const data: ClinicApiResponse = await response.json();

      if (onSuccess) {
        onSuccess(data.clinic.id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  const formContent = (
    <>
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
          onClick={asModal && onCancel ? onCancel : () => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type={asModal ? "button" : "submit"}
          variant="primary"
          disabled={isLoading}
          onClick={asModal ? submitForm : undefined}
        >
          {isLoading
            ? 'Guardando...'
            : clinicId
              ? 'Actualizar Clínica'
              : 'Crear Clínica'}
        </Button>
      </div>
    </>
  );

  if (asModal) {
    return <div className="space-y-6">{formContent}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formContent}
    </form>
  );
}
