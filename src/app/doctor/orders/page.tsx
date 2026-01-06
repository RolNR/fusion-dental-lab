'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrdersTable } from '@/components/lab-admin/OrdersTable';
import { OrderSearchFilter } from '@/components/orders/OrderSearchFilter';
import { OrderWithRelations } from '@/types/order';

export default function DoctorOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }

    if (status === 'authenticated') {
      // Debounce search to avoid too many API calls
      const timeoutId = setTimeout(() => {
        fetchOrders();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [status, router, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const url = `/api/doctor/orders${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
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
          title="Mis Órdenes"
          description="Gestiona todas tus órdenes dentales"
          action={{
            label: 'Crear Nueva Orden',
            href: '/doctor/orders/new',
            variant: 'primary',
          }}
        />

        {/* Search and Filters */}
        <div className="mb-6">
          <OrderSearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>

        <div className="rounded-xl bg-background shadow-md border border-border">
          <OrdersTable orders={orders} baseUrl="/doctor/orders" showDoctorColumn={false} />
        </div>
      </div>
    </div>
  );
}
