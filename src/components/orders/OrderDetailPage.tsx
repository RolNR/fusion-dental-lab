'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { OrderHeader } from '@/components/orders/OrderHeader';
import { OrderDetails } from '@/components/orders/OrderDetails';
import { OrderComments } from '@/components/orders/OrderComments';
import { FileList } from '@/components/orders/FileList';
import { UploadModal } from '@/components/orders/UploadModal';
import { OrderShippingLabel } from '@/components/orders/OrderShippingLabel';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { useSubmitOrder } from '@/hooks/useSubmitOrder';

interface OrderDetailPageProps {
  role: 'assistant' | 'doctor';
  showDoctorInfo?: boolean;
}

export function OrderDetailPage({ role, showDoctorInfo = false }: OrderDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const handlePrintShippingLabel = () => {
    window.print();
  };

  // Auto-print when print parameter is present
  useEffect(() => {
    if (searchParams.get('print') === 'true' && order) {
      // Wait a bit for the page to fully load
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [searchParams, order]);

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

        {/* Upload Reminder */}
        {searchParams.get('uploadReminder') === 'true' && order.status === OrderStatus.DRAFT && (
          <div className="mb-6 rounded-lg bg-primary/10 border border-primary/30 p-4">
            <div className="flex items-start gap-3">
              <Icons.info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary mb-1">Orden Creada Exitosamente</h3>
                <p className="text-sm text-primary/90">
                  Ahora puedes añadir archivos (STL/PLY, fotografías) usando el botón "Añadir
                  Archivos" a continuación. Cuando termines de subir los archivos, haz clic en
                  "Enviar para Revisión" para enviar la orden al laboratorio.
                </p>
              </div>
            </div>
          </div>
        )}

        {order.status === OrderStatus.NEEDS_INFO && order.comments && (
          <OrderComments comments={order.comments} />
        )}

        <OrderDetails
          order={order}
          showClinicInfo={!showDoctorInfo}
          showDoctorInfo={showDoctorInfo}
        />

        {/* Files Section */}
        <div className="mt-6 rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Archivos Adjuntos</h2>
          <FileList
            orderId={orderId}
            canDelete={
              order.status === OrderStatus.DRAFT || order.status === OrderStatus.NEEDS_INFO
            }
            onFileDeleted={() => refetch()}
            refreshTrigger={fileRefreshTrigger}
          />
        </div>

        {/* Print Shipping Label Button */}
        <div className="mt-6 print:hidden">
          <Button
            variant="secondary"
            onClick={handlePrintShippingLabel}
            className="w-full sm:w-auto"
          >
            <Icons.printer className="h-4 w-4 mr-2" />
            Imprimir Guía de Envío
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Imprime esta guía y coloque en tu caja para facilitar la recolección y entrega.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4 print:hidden">
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
              setFileRefreshTrigger((prev) => prev + 1);
              refetch();
            }}
          />
        )}

        {/* Shipping Label for printing */}
        <OrderShippingLabel order={order} />
      </div>
    </div>
  );
}
