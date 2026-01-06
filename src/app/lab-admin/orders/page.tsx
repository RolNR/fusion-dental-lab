'use client';

import { useEffect, useState } from 'react';
import { OrdersTable } from '@/components/lab-admin/OrdersTable';
import { OrderSearchFilter } from '@/components/orders/OrderSearchFilter';
import { OrderWithRelations } from '@/types/order';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);

        const url = `/api/lab-admin/orders${params.toString() ? `?${params.toString()}` : ''}`;
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
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchQuery]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Órdenes</h1>
        <p className="mt-2 text-muted-foreground">
          Todas las órdenes del laboratorio
        </p>
      </div>

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
      <OrdersTable orders={orders} />
    </div>
  );
}
