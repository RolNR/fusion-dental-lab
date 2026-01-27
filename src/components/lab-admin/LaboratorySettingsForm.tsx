'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface LaboratoryData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface LaboratorySettingsFormProps {
  initialData: LaboratoryData;
}

export function LaboratorySettingsForm({ initialData }: LaboratorySettingsFormProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/lab-admin/laboratory', {
        method: 'PATCH',
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
          setErrors({ general: data.error || 'Error al guardar cambios' });
        }
        return;
      }

      setSuccessMessage('Cambios guardados exitosamente');
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

      {successMessage && (
        <div className="rounded-md bg-success/10 p-4 text-sm text-success">{successMessage}</div>
      )}

      <Input
        label="Nombre del Laboratorio"
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
        placeholder="Mi Laboratorio Dental"
      />

      <Input
        label="Email de Contacto"
        name="email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        placeholder="contacto@laboratorio.com"
      />

      <Input
        label="Teléfono"
        name="phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        error={errors.phone}
        placeholder="(123) 456-7890"
      />

      <Input
        label="Dirección"
        name="address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        error={errors.address}
        placeholder="Av. Principal 123, Col. Centro"
      />

      <div className="flex justify-end">
        <Button type="submit" variant="primary" isLoading={isLoading}>
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}
