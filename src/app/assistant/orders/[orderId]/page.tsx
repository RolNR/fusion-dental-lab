'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { OrderHeader } from '@/components/orders/OrderHeader';
import { OrderDetails } from '@/components/orders/OrderDetails';
import { useOrderDetail } from '@/hooks/useOrderDetail';

export default function AssistantOrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const { order, loading, deleting, sessionStatus, handleDelete } = useOrderDetail({
    orderId,
    apiBasePath: '/api/assistant/orders',
    redirectPath: '/assistant/orders',
  });

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <OrderHeader
          orderNumber={order.orderNumber}
          status={order.status}
          createdAt={order.createdAt}
          backUrl="/assistant/orders"
        />

        <OrderDetails order={order} showClinicInfo={false} showDoctorInfo={true} />

        {order.status === 'DRAFT' && (
          <div className="mt-6">
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full"
            >
              {deleting ? 'Eliminando...' : 'Eliminar Orden'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
