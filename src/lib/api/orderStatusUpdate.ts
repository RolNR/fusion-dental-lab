import { prisma } from '@/lib/prisma';
import { Role, OrderStatus } from '@prisma/client';
import {
  canUserTransition,
  getTimestampUpdates,
  getTransitionErrorMessage,
} from '@/lib/orderStateMachine';

interface StatusUpdateParams {
  orderId: string;
  newStatus: OrderStatus;
  userId: string;
  userRole: Role;
}

interface StatusUpdateResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  order?: any;
}

/**
 * Updates an order's status with validation and audit logging
 *
 * Handles:
 * - State machine validation
 * - Role-based permission checks
 * - Timestamp updates
 * - Audit log creation
 *
 * @param params - Update parameters
 * @returns Result with success flag, error message, and updated order
 *
 * @example
 * const result = await updateOrderStatus({
 *   orderId: '123',
 *   newStatus: OrderStatus.PENDING_REVIEW,
 *   userId: 'user-id',
 *   userRole: Role.DOCTOR,
 * });
 *
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: result.statusCode });
 * }
 */
export async function updateOrderStatus({
  orderId,
  newStatus,
  userId,
  userRole,
}: StatusUpdateParams): Promise<StatusUpdateResult> {
  // Get the order with current status
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return {
      success: false,
      error: 'Orden no encontrada',
      statusCode: 404,
    };
  }

  // Check if the transition is valid for this user's role
  if (!canUserTransition(userRole, order.status, newStatus)) {
    const errorMessage = getTransitionErrorMessage(userRole, order.status, newStatus);
    return {
      success: false,
      error: errorMessage,
      statusCode: 400,
    };
  }

  // Update order status with appropriate timestamp
  const timestampUpdates = getTimestampUpdates(newStatus);
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      ...timestampUpdates,
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
        },
      },
      files: true,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'STATUS_CHANGE',
      entityType: 'Order',
      entityId: orderId,
      oldValue: order.status,
      newValue: newStatus,
      userId: userId,
      orderId: orderId,
    },
  });

  return {
    success: true,
    order: updatedOrder,
  };
}
