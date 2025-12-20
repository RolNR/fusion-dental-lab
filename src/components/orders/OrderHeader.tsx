import { OrderStatus } from '@prisma/client';
import Link from 'next/link';
import { getStatusLabel, getStatusColor } from '@/lib/orderStatusUtils';

interface OrderHeaderProps {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  backUrl: string;
  backLabel?: string;
}

export function OrderHeader({ orderNumber, status, createdAt, backUrl, backLabel = 'Volver a Órdenes' }: OrderHeaderProps) {
  return (
    <div className="mb-8">
      <Link href={backUrl} className="text-primary hover:text-primary/80 text-sm font-medium">
        ← {backLabel}
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
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
