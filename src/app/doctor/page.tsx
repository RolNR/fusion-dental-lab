'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { useAlerts } from '@/hooks/useAlerts';
import { useAlertActions } from '@/hooks/useAlertActions';
import { StatsCard } from '@/components/lab-admin/StatsCard';
import { QuickActions } from '@/components/ui/QuickActions';
import { AlertsList } from '@/components/ui/AlertsList';

interface OrderStats {
  total: number;
  draft: number;
  submitted: number;
  inProgress: number;
  completed: number;
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    draft: 0,
    submitted: 0,
    inProgress: 0,
    completed: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Use the new custom hook for alerts
  const {
    alerts,
    loading: alertsLoading,
    setAlerts,
  } = useAlerts({ role: Role.DOCTOR });

  // Use the alert actions hook
  const { handleMarkAsRead, handleDeleteAlert } = useAlertActions({
    role: 'doctor',
    onAlertsUpdate: setAlerts,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/doctor/orders');
      if (!response.ok) throw new Error('Error al cargar estadísticas');

      const data = await response.json();
      const orders = data.orders || [];

      const newStats = {
        total: orders.length,
        draft: orders.filter((o: { status: string }) => o.status === 'DRAFT').length,
        submitted: orders.filter((o: { status: string }) => o.status === 'SUBMITTED').length,
        inProgress: orders.filter((o: { status: string }) => o.status === 'IN_PROGRESS').length,
        completed: orders.filter((o: { status: string }) => o.status === 'COMPLETED').length,
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (status === 'loading' || statsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Bienvenido, Dr. {session?.user?.name}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Panel de control de órdenes dentales
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <StatsCard
            title="Total Órdenes"
            value={stats.total}
            description="Todas tus órdenes"
          />
          <StatsCard
            title="Borradores"
            value={stats.draft}
            description="En edición"
          />
          <StatsCard
            title="En Proceso"
            value={stats.submitted + stats.inProgress}
            description="Activas"
            variant="info"
          />
          <StatsCard
            title="Completadas"
            value={stats.completed}
            description="Finalizadas"
            variant="success"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <QuickActions
              columns={2}
              actions={[
                { label: 'Crear Nueva Orden', href: '/doctor/orders/new', variant: 'primary' },
                { label: 'Ver Todas las Órdenes', href: '/doctor/orders', variant: 'secondary' },
              ]}
            />

            <div className="rounded-xl bg-background p-6 shadow-md border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">Información</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Puedes crear órdenes en estado borrador y enviarlas cuando estén listas</p>
                <p>Las órdenes enviadas serán procesadas por el laboratorio</p>
                <p>Recibirás notificaciones sobre el estado de tus órdenes</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <AlertsList
              alerts={alerts}
              loading={alertsLoading}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteAlert}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
