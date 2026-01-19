'use client';

import Link from 'next/link';
import { Table, TableColumn } from '@/components/ui/Table';
import { getStatusLabel, getStatusColor } from '@/lib/orderStatusUtils';
import { OrderWithRelations } from '@/types/order';
import { Icons } from '@/components/ui/Icons';

interface OrdersTableProps {
  orders: OrderWithRelations[];
  baseUrl?: string;
  showDoctorColumn?: boolean;
}

export function OrdersTable({
  orders,
  baseUrl = '/lab-admin/orders',
  showDoctorColumn = true,
}: OrdersTableProps) {
  const columns: TableColumn<OrderWithRelations>[] = [
    {
      header: 'Número de Orden',
      accessor: (order) => (
        <div>
          <div className="text-sm font-medium text-foreground">{order.orderNumber}</div>
          <div className="text-sm text-muted-foreground">{order.patientName}</div>
        </div>
      ),
    },
    {
      header: 'Clínica',
      accessor: (order) => <span className="text-sm text-foreground">{order.clinic.name}</span>,
    },
    ...(showDoctorColumn
      ? [
          {
            header: 'Doctor',
            accessor: (order: OrderWithRelations) => (
              <span className="text-sm text-foreground">{order.doctor?.name || '-'}</span>
            ),
          },
        ]
      : []),
    {
      header: 'Estado',
      accessor: (order) => (
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>

          {/* Urgent Badge */}
          {order.isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-warning/10 text-warning">
              <Icons.zap className="h-3 w-3" />
              Urgente
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Fecha de Creación',
      accessor: (order) => (
        <span className="text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (order) => (
        <div className="flex gap-4">
          <Link
            href={`${baseUrl}/${order.id}`}
            className="text-primary hover:text-primary/80"
            onClick={(e) => e.stopPropagation()}
          >
            Ver Detalles
          </Link>
        </div>
      ),
      headerClassName: 'text-right',
      className: 'text-right text-sm font-medium',
    },
  ];

  return (
    <Table
      columns={columns}
      data={orders}
      keyExtractor={(order) => order.id}
      emptyMessage="No hay órdenes registradas"
    />
  );
}
