'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/Select';
import { OrdersTable, OrderWithRelations } from '@/components/lab-admin/OrdersTable';

export default function LabCollaboratorOrdersPage() {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const url = statusFilter
          ? `/api/lab-collaborator/orders?status=${statusFilter}`
          : '/api/lab-collaborator/orders';
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

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="PENDING_REVIEW">Pendiente Revisión</option>
          <option value="MATERIALS_SENT">Materiales Enviados</option>
          <option value="NEEDS_INFO">Necesita Información</option>
          <option value="IN_PROGRESS">En Proceso</option>
          <option value="COMPLETED">Completado</option>
          <option value="CANCELLED">Cancelado</option>
        </Select>
      </div>

      {/* Orders Table */}
      <OrdersTable orders={orders} baseUrl="/lab-collaborator/orders" />
    </div>
  );
}
