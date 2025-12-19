'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrdersTable, type OrderWithRelations } from '@/components/lab-admin/OrdersTable';

export default function AssistantOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

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
      const response = await fetch('/api/assistant/orders');
      if (!response.ok) throw new Error('Error al cargar órdenes');

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-base sm:text-lg text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
        <PageHeader
          title="Órdenes"
          description="Gestiona las órdenes de los doctores asignados"
          action={{
            label: 'Crear Nueva Orden',
            href: '/assistant/orders/new',
            variant: 'primary',
          }}
        />

        <div className="rounded-xl bg-background shadow-md border border-border">
          <OrdersTable orders={orders} baseUrl="/assistant/orders" />
        </div>
      </div>
    </div>
  );
}
