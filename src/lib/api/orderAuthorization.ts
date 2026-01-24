import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface OrderAccessResult {
  hasAccess: boolean;
  error?: string;
  statusCode?: number;
  order?: any;
}

interface CheckOrderAccessParams {
  orderId: string;
  userId: string;
  userRole: Role;
  laboratoryId?: string | null;
}

/**
 * Checks if a user has access to view/modify an order
 *
 * Access rules:
 * - Lab users: Can access orders from doctors in their laboratory
 * - Doctors: Can access their own orders
 */
export async function checkOrderAccess({
  orderId,
  userId,
  userRole,
  laboratoryId,
}: CheckOrderAccessParams): Promise<OrderAccessResult> {
  // Fetch order with doctor relationship
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      doctor: {
        select: {
          doctorLaboratoryId: true,
        },
      },
    },
  });

  if (!order) {
    return {
      hasAccess: false,
      error: 'Orden no encontrada',
      statusCode: 404,
    };
  }

  // Determine user type and check access
  const isLabUser = userRole === Role.LAB_ADMIN || userRole === Role.LAB_COLLABORATOR;

  if (isLabUser) {
    // Lab users can only access orders from doctors in their laboratory
    if (order.doctor.doctorLaboratoryId !== laboratoryId) {
      return {
        hasAccess: false,
        error: 'No tienes acceso a esta orden',
        statusCode: 403,
      };
    }
  } else if (userRole === Role.DOCTOR) {
    // Doctors can only access their own orders
    if (order.doctorId !== userId) {
      return {
        hasAccess: false,
        error: 'No tienes acceso a esta orden',
        statusCode: 403,
      };
    }
  } else {
    return {
      hasAccess: false,
      error: 'No tienes permisos para acceder a esta orden',
      statusCode: 403,
    };
  }

  return {
    hasAccess: true,
    order,
  };
}
