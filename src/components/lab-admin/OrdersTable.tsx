'use client';

import Link from 'next/link';
import { Table, TableColumn } from '@/components/ui/Table';
import { OrderStatus } from '@prisma/client';
import { getStatusLabel, getStatusColor } from '@/lib/orderStatusUtils';

type OrderWithRelations = {
  id: string;
  orderNumber: string;
  patientName: string;
  status: OrderStatus;
  createdAt: string;
  clinic: {
    id: string;
    name: string;
  };
  doctor?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
};

interface OrdersTableProps {
  orders: OrderWithRelations[];
  baseUrl?: string;
  showDoctorColumn?: boolean;
}

export function OrdersTable({ orders, baseUrl = '/lab-admin/orders', showDoctorColumn = true }: OrdersTableProps) {
  const columns: TableColumn<OrderWithRelations>[] = [
    {
      header: 'Número de Orden',
      accessor: (order) => (
        <div>
          <div className="text-sm font-medium text-foreground">
            {order.orderNumber}
          </div>
          <div className="text-sm text-muted-foreground">
            {order.patientName}
          </div>
        </div>
      ),
    },
    {
      header: 'Clínica',
      accessor: (order) => (
        <span className="text-sm text-foreground">{order.clinic.name}</span>
      ),
    },
    ...(showDoctorColumn ? [{
      header: 'Doctor',
      accessor: (order: OrderWithRelations) => (
        <span className="text-sm text-foreground">{order.doctor?.name || '-'}</span>
      ),
    }] : []),
    {
      header: 'Estado',
      accessor: (order) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
            order.status
          )}`}
        >
          {getStatusLabel(order.status)}
        </span>
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

export type { OrderWithRelations };
