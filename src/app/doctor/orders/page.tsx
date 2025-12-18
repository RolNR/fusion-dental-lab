'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrdersTable, type OrderWithRelations } from '@/components/lab-admin/OrdersTable';
import { Button } from '@/components/ui/Button';

export default function DoctorOrdersPage() {
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
      const response = await fetch('/api/doctor/orders');
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
        <div className="text-lg text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Órdenes</h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona todas tus órdenes dentales
            </p>
          </div>
          <Link href="/doctor/orders/new">
            <Button variant="primary">
              Crear Nueva Orden
            </Button>
          </Link>
        </div>

        <div className="rounded-xl bg-background shadow-md border border-border">
          <OrdersTable orders={orders} baseUrl="/doctor/orders" />
        </div>
      </div>
    </div>
  );
}
