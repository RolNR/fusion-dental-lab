import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Order } from '@/types/order';

interface UseOrderDetailOptions {
  orderId: string;
  apiBasePath: string;
  redirectPath: string;
}

interface UseOrderDetailResult {
  order: Order | null;
  loading: boolean;
  deleting: boolean;
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  handleDelete: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing order detail page logic
 *
 * Handles:
 * - Authentication redirects
 * - Order fetching
 * - Order deletion
 * - Loading states
 * - Error handling
 *
 * @param options - Configuration object
 * @param options.orderId - The ID of the order to fetch
 * @param options.apiBasePath - Base path for API endpoints (e.g., '/api/doctor/orders')
 * @param options.redirectPath - Path to redirect after delete or on error (e.g., '/doctor/orders')
 * @returns Object containing order data, loading states, and handler functions
 *
 * @example
 * const { order, loading, deleting, handleDelete } = useOrderDetail({
 *   orderId: '123',
 *   apiBasePath: '/api/doctor/orders',
 *   redirectPath: '/doctor/orders',
 * });
 */
export function useOrderDetail({
  orderId,
  apiBasePath,
  redirectPath,
}: UseOrderDetailOptions): UseOrderDetailResult {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await fetch(`${apiBasePath}/${orderId}`);
      if (!response.ok) {
        throw new Error('Error al cargar orden');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Error al cargar la orden');
      router.push(redirectPath);
    } finally {
      setLoading(false);
    }
  }, [orderId, apiBasePath, redirectPath, router]);

  // Handle authentication and initial fetch
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (sessionStatus === 'authenticated' && orderId) {
      fetchOrder();
    }
  }, [sessionStatus, orderId, fetchOrder, router]);

  const handleDelete = useCallback(async () => {
    if (!confirm('¿Estás seguro de eliminar esta orden?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`${apiBasePath}/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar orden');
      }

      router.push(redirectPath);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la orden');
    } finally {
      setDeleting(false);
    }
  }, [orderId, apiBasePath, redirectPath, router]);

  return {
    order,
    loading,
    deleting,
    sessionStatus,
    handleDelete,
    refetch: fetchOrder,
  };
}
