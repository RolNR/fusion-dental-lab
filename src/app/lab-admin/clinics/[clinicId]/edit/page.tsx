'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ClinicForm } from '@/components/lab-admin/ClinicForm';
import { Clinic } from '@/types/clinic';

export default function EditClinicPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClinic() {
      try {
        const response = await fetch(`/api/lab-admin/clinics/${clinicId}`);
        if (!response.ok) {
          throw new Error('Error al cargar clínica');
        }
        const data = await response.json();
        setClinic(data.clinic);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchClinic();
  }, [clinicId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error || 'Clínica no encontrada'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/lab-admin/clinics/${clinicId}`}
          className="text-sm text-primary hover:text-primary/80"
        >
          ← Volver a Detalles
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Editar Clínica</h1>
        <p className="mt-2 text-muted-foreground">Actualiza la información de {clinic.name}</p>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <ClinicForm
          clinicId={clinicId}
          initialData={{
            name: clinic.name,
            email: clinic.email || undefined,
            phone: clinic.phone || undefined,
            address: clinic.address || undefined,
          }}
        />
      </div>
    </div>
  );
}
