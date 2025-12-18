import { OrderStatus } from '@prisma/client';
import Link from 'next/link';

interface OrderHeaderProps {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  backUrl: string;
  backLabel?: string;
}

const getStatusLabel = (status: OrderStatus) => {
  const labels: Record<OrderStatus, string> = {
    DRAFT: 'Borrador',
    MATERIALS_SENT: 'Materiales Enviados',
    NEEDS_INFO: 'Necesita Información',
    IN_PROGRESS: 'En Proceso',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
  };
  return labels[status];
};

const getStatusColor = (status: OrderStatus) => {
  const colors: Record<OrderStatus, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    MATERIALS_SENT: 'bg-primary/10 text-primary',
    NEEDS_INFO: 'bg-warning/10 text-warning',
    IN_PROGRESS: 'bg-info/10 text-info',
    COMPLETED: 'bg-success/10 text-success',
    CANCELLED: 'bg-danger/10 text-danger',
  };
  return colors[status];
};

export function OrderHeader({ orderNumber, status, createdAt, backUrl, backLabel = 'Volver a Órdenes' }: OrderHeaderProps) {
  return (
    <div className="mb-8">
      <Link href={backUrl} className="text-primary hover:text-primary/80 text-sm font-medium">
        ← {backLabel}
      </Link>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Orden #{orderNumber}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Creada el {new Date(createdAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(status)}`}>
          {getStatusLabel(status)}
        </span>
      </div>
    </div>
  );
}

export { getStatusLabel, getStatusColor };
