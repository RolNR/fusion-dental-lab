'use client';

import { useParams, useRouter } from 'next/navigation';
import { ScanType } from '@prisma/client';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { OrderForm } from '@/components/clinic-staff/OrderForm';
import { isOrderEditable } from '@/lib/orderStatusUtils';

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
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Editar Orden</h1>
          <p className="mt-2 text-muted-foreground">
            Orden #{order.orderNumber}
          </p>
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
            material: order.material || '',
            materialBrand: order.materialBrand || '',
            color: order.color || '',
            scanType: order.scanType as ScanType | null,
            doctorId: order.doctorId,
            status: order.status,
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
