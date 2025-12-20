import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Role } from '@prisma/client';
import {
  canUserTransition,
  getTimestampUpdates,
  getTransitionErrorMessage,
} from '@/lib/orderStateMachine';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Only doctors, assistants, and clinic admins can submit orders
    const allowedRoles: Role[] = [Role.DOCTOR, Role.CLINIC_ASSISTANT, Role.CLINIC_ADMIN];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    const { orderId } = await params;

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        doctor: true,
        clinic: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Verify user has access to this order
    const userRole = session.user.role as Role;
    const userId = session.user.id;

    if (userRole === Role.DOCTOR && order.doctorId !== userId) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta orden' },
        { status: 403 }
      );
    }

    if (
      (userRole === Role.CLINIC_ASSISTANT || userRole === Role.CLINIC_ADMIN) &&
      order.clinicId !== session.user.clinicId
    ) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta orden' },
        { status: 403 }
      );
    }

    // Check if the transition is valid
    const newStatus = OrderStatus.PENDING_REVIEW;
    if (!canUserTransition(userRole, order.status, newStatus)) {
      const errorMessage = getTransitionErrorMessage(userRole, order.status, newStatus);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Update order status
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

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error submitting order:', error);
    return NextResponse.json(
      { error: 'Error al enviar la orden' },
      { status: 500 }
    );
  }
}
