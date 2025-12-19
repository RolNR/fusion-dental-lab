'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

interface Alert {
  id: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'RESOLVED';
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    patientName: string;
  };
  sender: {
    name: string;
    role: string;
  };
}

export default function AssistantDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    draft: 0,
    submitted: 0,
    inProgress: 0,
    completed: 0,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }

    if (status === 'authenticated') {
      fetchStats();
      fetchAlerts();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/assistant/orders');
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
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/assistant/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`/api/assistant/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READ' }),
      });

      if (response.ok) {
        setAlerts(alerts.map(alert =>
          alert.id === alertId ? { ...alert, status: 'READ' as const } : alert
        ));
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Bienvenido, {session?.user?.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Panel de control de órdenes dentales
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Órdenes"
            value={stats.total}
            description="Todas las órdenes"
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
          />
          <StatsCard
            title="Completadas"
            value={stats.completed}
            description="Finalizadas"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <QuickActions
              columns={2}
              actions={[
                { label: 'Crear Nueva Orden', href: '/assistant/orders/new', variant: 'primary' },
                { label: 'Ver Todas las Órdenes', href: '/assistant/orders', variant: 'secondary' },
              ]}
            />

            <div className="rounded-xl bg-background p-6 shadow-md border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">Información</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Crea órdenes en nombre de los doctores asignados</p>
                <p>Las órdenes en borrador pueden ser editadas antes de enviarse</p>
                <p>Recibirás notificaciones sobre el estado de las órdenes</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <AlertsList
              alerts={alerts}
              baseUrl="/assistant/orders"
              loading={alertsLoading}
              onMarkAsRead={handleMarkAsRead}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
