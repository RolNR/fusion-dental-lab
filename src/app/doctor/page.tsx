'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { useAlerts } from '@/hooks/useAlerts';
import { useAlertActions } from '@/hooks/useAlertActions';
import { OrdersTable } from '@/components/lab-admin/OrdersTable';
import { AlertsList } from '@/components/ui/AlertsList';
import { Button } from '@/components/ui/Button';
import { OrderWithRelations } from '@/types/order';
import { DashboardAIPrompt } from '@/components/clinic-staff/DashboardAIPrompt';
import Link from 'next/link';

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

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
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/doctor/orders');
      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', response.status, data);
        throw new Error(data.error || 'Error al cargar órdenes');
      }

      const fetchedOrders = data.orders || [];
      setOrders(fetchedOrders.slice(0, 10)); // Show latest 10 orders
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (status === 'loading' || ordersLoading) {
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
            Buen día, Dr. {session?.user?.name}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Panel de control de órdenes dentales
          </p>
        </div>

        <DashboardAIPrompt role="doctor" />

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
