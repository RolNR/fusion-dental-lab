'use client';

import Link from 'next/link';
import { Table, TableColumn } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { getStatusLabel, getStatusColor } from '@/lib/orderStatusUtils';
import { OrderWithRelations } from '@/types/order';
import { Icons } from '@/components/ui/Icons';

interface OrdersTableProps {
  orders: OrderWithRelations[];
  baseUrl?: string;
  showDoctorColumn?: boolean;
  showPrintIcon?: boolean;
  // Pagination props
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function OrdersTable({
  orders,
  baseUrl = '/lab-admin/orders',
  showDoctorColumn = true,
  showPrintIcon = false,
  pagination,
  onPageChange,
  isLoading = false,
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
    ...(showDoctorColumn
      ? [
          {
            header: 'Doctor',
            accessor: (order: OrderWithRelations) => (
              <div>
                <div className="text-sm font-medium text-foreground">
                  {order.doctor?.name || '-'}
                </div>
                {order.doctor?.clinicName && (
                  <div className="text-xs text-muted-foreground">{order.doctor.clinicName}</div>
                )}
              </div>
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

          {/* Archived Badge */}
          {order.deletedAt && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-muted text-muted-foreground">
              <Icons.archive className="h-3 w-3" />
              Archivado
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
      header: '',
      accessor: (order) => (
        <div className="flex gap-2 justify-end">
          <Link
            href={`${baseUrl}/${order.id}`}
            className="text-primary hover:text-primary/80 p-2"
            onClick={(e) => e.stopPropagation()}
            title="Ver detalles"
          >
            <Icons.eye size={18} />
          </Link>
          {showPrintIcon && order.status !== 'DRAFT' && (
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to detail page and trigger print
                window.location.href = `${baseUrl}/${order.id}?print=true`;
              }}
              className="text-muted-foreground hover:text-foreground p-2"
              title="Imprimir guía de envío"
            >
              <Icons.printer size={18} />
            </Button>
          )}
        </div>
      ),
      headerClassName: 'text-right',
      className: 'text-right',
      mobileLabel: 'Acciones',
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        data={orders}
        keyExtractor={(order) => order.id}
        emptyMessage="No hay órdenes registradas"
      />
      {pagination && onPageChange && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
