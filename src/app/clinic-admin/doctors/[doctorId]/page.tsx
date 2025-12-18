'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type DoctorDetail = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function DoctorDetailPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;

  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error || 'Doctor no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-4">
            <Link
              href="/clinic-admin/doctors"
              className="text-sm text-primary hover:text-primary/80"
            >
              ← Volver a Doctores
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{doctor.name}</h1>
          <p className="mt-2 text-muted-foreground">
            Detalles del doctor
          </p>
        </div>
        <Link href={`/clinic-admin/doctors/${doctorId}/edit`}>
          <Button variant="primary">Editar Doctor</Button>
        </Link>
      </div>

      {/* Doctor Information */}
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <h2 className="mb-6 text-xl font-semibold text-foreground">
          Información del Doctor
        </h2>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
            <dd className="mt-1 text-sm text-foreground">{doctor.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="mt-1 text-sm text-foreground">{doctor.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Fecha de Registro</dt>
            <dd className="mt-1 text-sm text-foreground">
              {new Date(doctor.createdAt).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
