import { prisma } from '@/lib/prisma';
import { Role, OrderStatus } from '@prisma/client';
import eventBus from '@/lib/sse/eventBus';
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
  comment?: string;
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
  comment,
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

  // Create comment if provided (e.g., when requesting more info)
  if (comment && comment.trim()) {
    await prisma.orderComment.create({
      data: {
        content: comment.trim(),
        orderId: orderId,
        authorId: userId,
      },
    });
  }

  // Create alerts and emit SSE events when status changes to NEEDS_INFO
  if (newStatus === OrderStatus.NEEDS_INFO) {
    try {
      // Get doctor and assistants to notify
      const [doctor, doctorAssistants] = await Promise.all([
        prisma.user.findUnique({
          where: { id: updatedOrder.doctorId },
          select: { id: true, name: true },
        }),
        prisma.doctorAssistant.findMany({
          where: { doctorId: updatedOrder.doctorId },
          include: {
            assistant: {
              select: { id: true, name: true },
            },
          },
        }),
      ]);

      // Prepare recipients (doctor + all assistants)
      const recipients = [
        doctor,
        ...doctorAssistants.map((da) => da.assistant),
      ].filter((r): r is NonNullable<typeof r> => !!r);

      if (recipients.length > 0) {
        const alertMessage = `Se requiere información adicional para la orden #${updatedOrder.orderNumber} del paciente ${updatedOrder.patientName}`;

        for (const recipient of recipients) {
          // Create the alert in the DB and include order and sender info for SSE
          const newAlert = await prisma.alert.create({
            data: {
              message: alertMessage,
              status: 'UNREAD',
              orderId: orderId,
              senderId: userId,
              receiverId: recipient.id,
            },
            include: {
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  patientName: true,
                },
              },
              sender: {
                select: {
                  name: true,
                  role: true,
                },
              },
            },
          });

          // Emit a type-safe event with serialized dates
          eventBus.emit('new-alert', {
            ...newAlert,
            createdAt: newAlert.createdAt.toISOString(),
            readAt: newAlert.readAt?.toISOString() ?? null,
            resolvedAt: newAlert.resolvedAt?.toISOString() ?? null,
          });
        }
      }
    } catch (alertError) {
      // Log error but don't fail the status update
      console.error('Error creating and emitting alerts:', alertError);
    }
  }

  return {
    success: true,
    order: updatedOrder,
  };
}
