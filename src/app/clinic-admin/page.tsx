'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/lab-admin/StatsCard';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type ClinicStats = {
  clinic: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    _count: {
      clinicAdmins: number;
      doctors: number;
      assistants: number;
      orders: number;
    };
  };
  ordersByStatus: Record<string, number>;
};

export default function ClinicAdminDashboard() {
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/clinic-admin/stats');
        if (!response.ok) {
          throw new Error('Error al cargar estadísticas');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
        <div className="text-center text-sm sm:text-base text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-4 sm:p-6 text-sm sm:text-base text-danger">
          Error: {error || 'No se pudieron cargar las estadísticas'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
          Panel de Administración de Clínica
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          {stats.clinic.name}
        </p>
      </div>

      {/* Clinic Info */}
      <div className="mb-6 sm:mb-8 rounded-xl bg-background p-4 sm:p-6 shadow-md border border-border">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
          Información de la Clínica
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
            <dd className="mt-1 text-sm text-foreground">{stats.clinic.name}</dd>
          </div>
          {stats.clinic.email && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm text-foreground">{stats.clinic.email}</dd>
            </div>
          )}
          {stats.clinic.phone && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Teléfono</dt>
              <dd className="mt-1 text-sm text-foreground">{stats.clinic.phone}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <StatsCard
          title="Total Órdenes"
          value={stats.clinic._count.orders}
          description="Órdenes totales"
        />
        <StatsCard
          title="Doctores"
          value={stats.clinic._count.doctors}
          description="Doctores activos"
        />
        <StatsCard
          title="Asistentes"
          value={stats.clinic._count.assistants}
          description="Asistentes activos"
        />
        <StatsCard
          title="En Proceso"
          value={stats.ordersByStatus.IN_PROGRESS || 0}
          description="Órdenes en proceso"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-background p-4 sm:p-6 shadow-md border border-border">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/clinic-admin/orders">
            <Button variant="primary" className="w-full">
              Ver Órdenes
            </Button>
          </Link>
          <Link href="/clinic-admin/doctors">
            <Button variant="primary" className="w-full">
              Gestionar Doctores
            </Button>
          </Link>
          <Link href="/clinic-admin/assistants">
            <Button variant="secondary" className="w-full">
              Gestionar Asistentes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
