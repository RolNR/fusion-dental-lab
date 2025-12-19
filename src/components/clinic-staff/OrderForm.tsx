'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Doctor } from '@/types/user';

interface OrderFormProps {
  initialData?: {
    patientName: string;
    patientId?: string;
    description?: string;
    notes?: string;
    teethNumbers?: string;
    material?: string;
    materialBrand?: string;
    color?: string;
    scanType?: 'DIGITAL' | 'PHYSICAL' | 'NONE';
    doctorId?: string;
  };
  orderId?: string;
  role: 'doctor' | 'assistant';
  onSuccess?: () => void;
}

export function OrderForm({ initialData, orderId, role, onSuccess }: OrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentDoctorName, setCurrentDoctorName] = useState<string>('');

  const [formData, setFormData] = useState({
    patientName: initialData?.patientName || '',
    patientId: initialData?.patientId || '',
    description: initialData?.description || '',
    notes: initialData?.notes || '',
    teethNumbers: initialData?.teethNumbers || '',
    material: initialData?.material || '',
    materialBrand: initialData?.materialBrand || '',
    color: initialData?.color || '',
    scanType: initialData?.scanType || 'NONE' as 'DIGITAL' | 'PHYSICAL' | 'NONE',
    doctorId: initialData?.doctorId || '',
  });

  // Fetch current user info if doctor
  useEffect(() => {
    if (role === 'doctor') {
      fetchCurrentDoctor();
    } else if (role === 'assistant') {
      fetchDoctors();
    }
  }, [role]);

  const fetchCurrentDoctor = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      if (session?.user?.name) {
        setCurrentDoctorName(session.user.name);
      }
    } catch (err) {
      console.error('Error fetching current doctor:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/assistant/doctors');
      const data = await response.json();
      setDoctors(data.doctors || []);

      // Set first doctor as default if creating new order
      if (!orderId && data.doctors.length > 0) {
        setFormData(prev => ({ ...prev, doctorId: data.doctors[0].id }));
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = orderId
        ? `/api/${role}/orders/${orderId}`
        : `/api/${role}/orders`;

      const method = orderId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar orden');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/${role}/orders`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-danger/10 p-4 text-danger">
          {error}
        </div>
      )}

      {role === 'doctor' && (
        <Select
          label="Doctor"
          id="doctorId"
          value=""
          onChange={() => {}}
          disabled={true}
        >
          <option value="">{currentDoctorName || 'Cargando...'}</option>
        </Select>
      )}

      {role === 'assistant' && (
        <div>
          <Select
            label="Doctor"
            id="doctorId"
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
            required
            disabled={isLoading || !!orderId || doctors.length === 0}
          >
            <option value="">Seleccionar doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} ({doctor.email})
              </option>
            ))}
          </Select>
          {doctors.length === 0 && (
            <p className="mt-2 text-sm text-warning">
              No tienes doctores asignados. Contacta al administrador de la clínica para que te asigne doctores.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Nombre del Paciente"
          type="text"
          value={formData.patientName}
          onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
          required
          disabled={isLoading}
          placeholder="Juan Pérez"
        />

        <Input
          label="ID del Paciente"
          type="text"
          value={formData.patientId}
          onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
          disabled={isLoading}
          placeholder="PAC-12345"
        />
      </div>

      <Textarea
        label="Descripción"
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        disabled={isLoading}
        rows={3}
        placeholder="Descripción del trabajo dental..."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Números de Dientes"
          type="text"
          value={formData.teethNumbers}
          onChange={(e) => setFormData({ ...formData, teethNumbers: e.target.value })}
          disabled={isLoading}
          placeholder="11, 12, 21, 22"
        />

        <Select
          label="Tipo de Escaneo"
          id="scanType"
          value={formData.scanType}
          onChange={(e) => setFormData({ ...formData, scanType: e.target.value as any })}
          disabled={isLoading}
        >
          <option value="NONE">Ninguno</option>
          <option value="DIGITAL">Digital</option>
          <option value="ANALOG_MOLD">Molde Analógico</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Input
          label="Material"
          type="text"
          value={formData.material}
          onChange={(e) => setFormData({ ...formData, material: e.target.value })}
          disabled={isLoading}
          placeholder="Zirconia, Porcelana..."
        />

        <Input
          label="Marca del Material"
          type="text"
          value={formData.materialBrand}
          onChange={(e) => setFormData({ ...formData, materialBrand: e.target.value })}
          disabled={isLoading}
          placeholder="IPS e.max..."
        />

        <Input
          label="Color"
          type="text"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          disabled={isLoading}
          placeholder="A2, B1..."
        />
      </div>

      <Textarea
        label="Notas Adicionales"
        id="notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        disabled={isLoading}
        rows={4}
        placeholder="Instrucciones especiales, observaciones..."
      />

      <div className="flex gap-4">
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {orderId ? 'Actualizar Orden' : 'Crear Orden'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
