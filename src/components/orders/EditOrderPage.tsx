'use client';

import { useParams, useRouter } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { OrderForm } from '@/components/clinic-staff/OrderForm';
import { isOrderEditable } from '@/lib/orderStatusUtils';
import { OrderComments } from '@/components/orders/OrderComments';
import { FileList } from '@/components/orders/FileList';

interface EditOrderPageProps {
  role: 'assistant' | 'doctor';
}

export function EditOrderPage({ role }: EditOrderPageProps) {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const { order, loading, sessionStatus } = useOrderDetail({
    orderId,
    apiBasePath: `/api/${role}/orders`,
    redirectPath: `/${role}/orders`,
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

  // Only allow editing DRAFT and NEEDS_INFO orders
  if (!isOrderEditable(order.status)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-danger">
          Solo se pueden editar órdenes en borrador o que necesitan información
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Editar Orden
          </h1>
          <p className="mt-2 text-muted-foreground">Orden #{order.orderNumber}</p>
        </div>

        {order.status === OrderStatus.NEEDS_INFO && order.comments && (
          <OrderComments comments={order.comments} />
        )}

        {/* Show existing files when editing an order */}
        <div className="mb-6 rounded-lg border border-border bg-background p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Archivos Adjuntos Existentes
          </h2>
          <FileList orderId={orderId} canDelete={true} />
        </div>

        <OrderForm
          role={role}
          orderId={orderId}
          initialData={{
            patientName: order.patientName,
            patientId: order.patientId || '',
            description: order.description || '',
            notes: order.notes || '',
            teethNumbers: order.teethNumbers || '',
            isDigitalScan: order.isDigitalScan,
            doctorId: order.doctorId,
            status: order.status,
            teeth: order.teeth || [],
            // Odontogram initial states (AUSENTE, PILAR, IMPLANTE markings)
            initialToothStates: order.initialToothStates,
            // Case type fields
            tipoCaso: order.tipoCaso,
            motivoGarantia: order.motivoGarantia || '',
            seDevuelveTrabajoOriginal: order.seDevuelveTrabajoOriginal,
            // Digital scan details
            escanerUtilizado: order.escanerUtilizado,
            otroEscaner: order.otroEscaner || '',
            // Order settings
            materialSent: order.materialSent,
            submissionType: order.submissionType,
            oclusionDiseno: order.oclusionDiseno,
            articulatedBy: order.articulatedBy,
            // Other fields
            isUrgent: order.isUrgent,
            fechaEntregaDeseada: order.fechaEntregaDeseada,
            aiPrompt: order.aiPrompt || '',
          }}
          onSuccess={() => {
            router.push(`/${role}/orders/${orderId}`);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
