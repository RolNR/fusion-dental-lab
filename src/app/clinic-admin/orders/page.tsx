'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { OrdersTable } from '@/components/lab-admin/OrdersTable';
import { OrderWithRelations } from '@/types/order';

export default function ClinicOrdersPage() {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const url = statusFilter
          ? `/api/clinic-admin/orders?status=${statusFilter}`
          : '/api/clinic-admin/orders';
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Error al cargar órdenes');
        }
        const data = await response.json();
        setOrders(data.orders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [statusFilter]);

  if (isLoading) {
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
      <PageHeader
        title="Órdenes"
        description="Todas las órdenes de la clínica"
      />

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="MATERIALS_SENT">Materiales Enviados</option>
          <option value="NEEDS_INFO">Necesita Información</option>
          <option value="IN_PROGRESS">En Proceso</option>
          <option value="COMPLETED">Completado</option>
          <option value="CANCELLED">Cancelado</option>
        </Select>
      </div>

      {/* Orders Table */}
      <OrdersTable orders={orders} baseUrl="/clinic-admin/orders" />
    </div>
  );
}
