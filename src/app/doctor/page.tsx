'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, OrderStatus } from '@prisma/client';
import { useAlerts } from '@/hooks/useAlerts';
import { useAlertActions } from '@/hooks/useAlertActions';
import { StatsCard } from '@/components/lab-admin/StatsCard';
import { OrdersTable } from '@/components/lab-admin/OrdersTable';
import { AlertsList } from '@/components/ui/AlertsList';
import { Button } from '@/components/ui/Button';
import { OrderWithRelations } from '@/types/order';
import Link from 'next/link';

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
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeClinicName, setActiveClinicName] = useState<string>('');

  // Use the new custom hook for alerts
  const { alerts, loading: alertsLoading, setAlerts } = useAlerts({ role: Role.DOCTOR });

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
      fetchActiveClinic();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/doctor/orders');
      if (!response.ok) throw new Error('Error al cargar estadísticas');

      const data = await response.json();
      const fetchedOrders = data.orders || [];

      const newStats = {
        total: fetchedOrders.length,
        draft: fetchedOrders.filter((o: OrderWithRelations) => o.status === OrderStatus.DRAFT)
          .length,
        submitted: fetchedOrders.filter(
          (o: OrderWithRelations) => o.status === OrderStatus.PENDING_REVIEW
        ).length,
        inProgress: fetchedOrders.filter(
          (o: OrderWithRelations) => o.status === OrderStatus.IN_PROGRESS
        ).length,
        completed: fetchedOrders.filter(
          (o: OrderWithRelations) => o.status === OrderStatus.COMPLETED
        ).length,
      };

      setStats(newStats);
      setOrders(fetchedOrders.slice(0, 10)); // Show latest 10 orders
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchActiveClinic = async () => {
    try {
      const response = await fetch('/api/doctor/clinics');
      if (!response.ok) return;

      const data = await response.json();
      const currentClinic = data.clinics?.find((c: any) => c.isCurrent);
      if (currentClinic) {
        setActiveClinicName(currentClinic.name);
      }
    } catch (error) {
      console.error('Error fetching active clinic:', error);
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
            {activeClinicName
              ? `Panel de control de órdenes dentales - ${activeClinicName}`
              : 'Panel de control de órdenes dentales'}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <StatsCard title="Total Órdenes" value={stats.total} description="Todas tus órdenes" />
          <StatsCard title="Borradores" value={stats.draft} description="En edición" />
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
            {/* Recent Orders */}
            <div className="rounded-xl bg-background shadow-md border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  Órdenes Recientes
                </h2>
                <Link href="/doctor/orders/new">
                  <Button variant="primary" size="sm">
                    Crear Nueva Orden
                  </Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <OrdersTable orders={orders} baseUrl="/doctor/orders" showDoctorColumn={false} />
              </div>
              {orders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground p-4">
                  <p className="mb-4">No tienes órdenes aún</p>
                  <Link href="/doctor/orders/new">
                    <Button variant="primary">Crear tu Primera Orden</Button>
                  </Link>
                </div>
              )}
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
