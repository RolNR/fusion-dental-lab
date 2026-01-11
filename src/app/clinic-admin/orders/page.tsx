'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrdersTable } from '@/components/lab-admin/OrdersTable';
import { OrderSearchFilter } from '@/components/orders/OrderSearchFilter';
import { OrderWithRelations } from '@/types/order';

const SEARCH_DEBOUNCE_MS = 300;

export default function ClinicOrdersPage() {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);

        const url = `/api/clinic-admin/orders${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Error al cargar órdenes');
        }
        const data = await response.json();
        setOrders(data.orders);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsInitialLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchQuery]);

  if (isInitialLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
        <div className="text-center text-sm sm:text-base text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-sm sm:text-base text-danger">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
      <PageHeader title="Órdenes" description="Todas las órdenes de la clínica" />

      {/* Search and Filters */}
      <div className="mb-6">
        <OrderSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {/* Orders Table */}
      <OrdersTable orders={orders} baseUrl="/clinic-admin/orders" />
    </div>
  );
}
