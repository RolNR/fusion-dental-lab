'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { StatsCard } from '@/components/lab-admin/StatsCard';
import { QuickActions } from '@/components/ui/QuickActions';

type ClinicDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    clinicAdmins: number;
    doctors: number;
    assistants: number;
    orders: number;
  };
};

export default function ClinicDetailPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;

  const [clinic, setClinic] = useState<ClinicDetail | null>(null);
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error || 'Clínica no encontrada'}
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
              href="/lab-admin/clinics"
              className="text-sm text-primary hover:text-primary/80"
            >
              ← Volver a Clínicas
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{clinic.name}</h1>
          <p className="mt-2 text-muted-foreground">
            Detalles de la clínica
          </p>
        </div>
        <Link href={`/lab-admin/clinics/${clinicId}/edit`}>
          <Button variant="primary">Editar Clínica</Button>
        </Link>
      </div>

      {/* Status Badge */}
      <div className="mb-8">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
            clinic.isActive
              ? 'bg-success/10 text-success'
              : 'bg-danger/10 text-danger'
          }`}
        >
          {clinic.isActive ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions
          title="Agregar Usuarios a la Clínica"
          actions={[
            {
              label: '+ Agregar Doctor',
              href: `/lab-admin/users/new?clinicId=${clinicId}&role=DOCTOR`,
              variant: 'secondary',
            },
            {
              label: '+ Agregar Administrador',
              href: `/lab-admin/users/new?clinicId=${clinicId}&role=CLINIC_ADMIN`,
              variant: 'secondary',
            },
            {
              label: '+ Agregar Asistente',
              href: `/lab-admin/users/new?clinicId=${clinicId}&role=CLINIC_ASSISTANT`,
              variant: 'secondary',
            },
          ]}
          columns={3}
        />
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Usuarios"
          value={clinic._count.clinicAdmins + clinic._count.doctors + clinic._count.assistants}
          description="Usuarios activos"
        />
        <StatsCard
          title="Doctores"
          value={clinic._count.doctors}
          description="Doctores registrados"
        />
        <StatsCard
          title="Asistentes"
          value={clinic._count.assistants}
          description="Asistentes activos"
        />
        <StatsCard
          title="Órdenes"
          value={clinic._count.orders}
          description="Órdenes totales"
        />
      </div>

      {/* Clinic Information */}
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <h2 className="mb-6 text-xl font-semibold text-foreground">
          Información de Contacto
        </h2>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="mt-1 text-sm text-foreground">
              {clinic.email || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Teléfono</dt>
            <dd className="mt-1 text-sm text-foreground">
              {clinic.phone || '-'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">Dirección</dt>
            <dd className="mt-1 text-sm text-foreground">
              {clinic.address || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Fecha de Registro</dt>
            <dd className="mt-1 text-sm text-foreground">
              {new Date(clinic.createdAt).toLocaleDateString('es-MX', {
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
