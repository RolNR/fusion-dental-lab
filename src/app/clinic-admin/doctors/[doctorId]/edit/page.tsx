'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StaffForm } from '@/components/clinic-admin/StaffForm';

type DoctorData = {
  id: string;
  name: string;
  email: string;
};

export default function EditDoctorPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;

  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoctor() {
      try {
        const response = await fetch(`/api/clinic-admin/doctors/${doctorId}`);
        if (!response.ok) {
          throw new Error('Error al cargar doctor');
        }
        const data = await response.json();
        setDoctor(data.doctor);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDoctor();
  }, [doctorId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error || 'Doctor no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/clinic-admin/doctors/${doctorId}`}
          className="text-sm text-primary hover:text-primary/80"
        >
          ← Volver a Detalles
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">
          Editar Doctor
        </h1>
        <p className="mt-2 text-muted-foreground">
          Actualiza la información de {doctor.name}
        </p>
      </div>

      {/* Form */}
      <div className="rounded-lg bg-background p-6 shadow border border-border">
        <StaffForm
          staffId={doctorId}
          staffType="doctor"
          initialData={{
            name: doctor.name,
            email: doctor.email,
          }}
        />
      </div>
    </div>
  );
}
