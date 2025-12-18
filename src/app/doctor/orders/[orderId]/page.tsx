'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { OrderHeader } from '@/components/orders/OrderHeader';
import { OrderDetails } from '@/components/orders/OrderDetails';
import { OrderStatus } from '@prisma/client';

interface Order {
  id: string;
  orderNumber: string;
  patientName: string;
  patientId?: string;
  description?: string;
  notes?: string;
  teethNumbers?: string;
  material?: string;
  materialBrand?: string;
  color?: string;
  scanType?: string;
  status: OrderStatus;
  createdAt: string;
  clinic: {
    name: string;
    email?: string;
    phone?: string;
  };
  createdBy: {
    name: string;
    role: string;
  };
}

export default function DoctorOrderDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login');
    }

    if (sessionStatus === 'authenticated' && orderId) {
      fetchOrder();
    }
  }, [sessionStatus, orderId, router]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/doctor/orders/${orderId}`);
      if (!response.ok) throw new Error('Error al cargar orden');

      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Error al cargar la orden');
      router.push('/doctor/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta orden?')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/doctor/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar orden');
      }

      router.push('/doctor/orders');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la orden');
    } finally {
      setDeleting(false);
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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <OrderHeader
          orderNumber={order.orderNumber}
          status={order.status}
          createdAt={order.createdAt}
          backUrl="/doctor/orders"
        />

        <OrderDetails order={order} showClinicInfo={true} />

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
