'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { OrderHeader } from '@/components/orders/OrderHeader';
import { OrderDetails } from '@/components/orders/OrderDetails';
import { OrderComments } from '@/components/orders/OrderComments';
import { FileList } from '@/components/orders/FileList';
import { UploadModal } from '@/components/orders/UploadModal';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { useSubmitOrder } from '@/hooks/useSubmitOrder';

interface OrderDetailPageProps {
  role: 'assistant' | 'doctor';
  showDoctorInfo?: boolean;
}

export function OrderDetailPage({ role, showDoctorInfo = false }: OrderDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0);

  const redirectPath = `/${role}/orders`;

  const { order, loading, deleting, sessionStatus, handleDelete, refetch } = useOrderDetail({
    orderId,
    apiBasePath: `/api/${role}/orders`,
    redirectPath,
  });

  const { submitOrder, submitting } = useSubmitOrder({ role });

  const handleSubmitForReview = async () => {
    const success = await submitOrder(orderId, refetch);
    if (success) {
      refetch();
    }
  };

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
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <OrderHeader
          orderNumber={order.orderNumber}
          status={order.status}
          createdAt={order.createdAt}
          backUrl={redirectPath}
        />

        {order.status === OrderStatus.NEEDS_INFO && order.comments && (
          <OrderComments comments={order.comments} />
        )}

        <OrderDetails order={order} showClinicInfo={!showDoctorInfo} showDoctorInfo={showDoctorInfo} />

        {/* Files Section */}
        <div className="mt-6 rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Archivos Adjuntos</h2>
          <FileList
            orderId={orderId}
            canDelete={order.status === OrderStatus.DRAFT || order.status === OrderStatus.NEEDS_INFO}
            onFileDeleted={() => refetch()}
            refreshTrigger={fileRefreshTrigger}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          {(order.status === 'DRAFT' || order.status === 'NEEDS_INFO') && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowUploadModal(true)}
                className="sm:flex-1"
              >
                <Icons.upload className="h-4 w-4 mr-2" />
                Añadir Archivos
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push(`/${role}/orders/${orderId}/edit`)}
                className="sm:flex-1"
              >
                Editar Orden
              </Button>
              <Button
                variant="secondary"
                onClick={handleSubmitForReview}
                disabled={submitting}
                className="sm:flex-1"
              >
                {submitting ? 'Enviando...' : 'Enviar para Revisión'}
              </Button>
            </>
          )}
          {order.status === 'DRAFT' && (
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
              className="sm:flex-1"
            >
              {deleting ? 'Eliminando...' : 'Eliminar Orden'}
            </Button>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            orderId={orderId}
            onClose={() => {
              setShowUploadModal(false);
              setFileRefreshTrigger(prev => prev + 1);
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
}
