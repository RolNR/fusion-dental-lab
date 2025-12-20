import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, OrderStatus } from '@prisma/client';
import { z } from 'zod';
import { updateOrderStatus } from '@/lib/api/orderStatusUpdate';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';

// GET /api/lab-admin/orders/[orderId] - Get specific order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check authorization (only LAB_ADMIN and LAB_COLLABORATOR)
    const allowedRoles: Role[] = [Role.LAB_ADMIN, Role.LAB_COLLABORATOR];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { orderId } = await params;
    const userRole = session.user.role as Role;
    const userId = session.user.id;

    // Check user has access to this order
    const accessCheck = await checkOrderAccess({
      orderId,
      userId,
      userRole,
      laboratoryId: session.user.laboratoryId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.statusCode }
      );
    }

    // Fetch order with full details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
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
            role: true,
          },
        },
        files: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileType: true,
            fileSize: true,
            storageUrl: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Error al obtener orden' },
      { status: 500 }
    );
  }
}

// PATCH /api/lab-admin/orders/[orderId] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Only lab admin and lab collaborator can update order status
    const allowedRoles: Role[] = [Role.LAB_ADMIN, Role.LAB_COLLABORATOR];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    const { orderId } = await params;
    const userRole = session.user.role as Role;
    const userId = session.user.id;

    // Check user has access to this order
    const accessCheck = await checkOrderAccess({
      orderId,
      userId,
      userRole,
      laboratoryId: session.user.laboratoryId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.statusCode }
      );
    }

    // Validate request body
    const updateSchema = z.object({
      status: z.nativeEnum(OrderStatus),
    });

    const body = await request.json();
    let validatedData;

    try {
      validatedData = updateSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: err.issues },
          { status: 400 }
        );
      }
      throw err;
    }

    const newStatus = validatedData.status;

    // Update order status using shared utility
    const updateResult = await updateOrderStatus({
      orderId,
      newStatus,
      userId,
      userRole,
    });

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error },
        { status: updateResult.statusCode }
      );
    }

    return NextResponse.json(updateResult.order);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el estado de la orden' },
      { status: 500 }
    );
  }
}
