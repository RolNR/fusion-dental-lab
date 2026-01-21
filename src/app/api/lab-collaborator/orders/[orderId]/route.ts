import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, OrderStatus } from '@prisma/client';
import { z } from 'zod';
import { updateOrderStatus } from '@/lib/api/orderStatusUpdate';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';

// GET /api/lab-collaborator/orders/[orderId] - Get specific order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check authorization (only LAB_COLLABORATOR)
    if (session.user.role !== Role.LAB_COLLABORATOR) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { orderId } = await params;
    const userRole = session.user.role as Role;
    const userId = session.user.id;

    // Get laboratory ID from session
    const laboratoryId = session.user.laboratoryId;
    if (!laboratoryId) {
      return NextResponse.json({ error: 'Usuario no asociado a un laboratorio' }, { status: 400 });
    }

    // Check user has access to this order
    const accessCheck = await checkOrderAccess({
      orderId,
      userId,
      userRole,
      laboratoryId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.statusCode });
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
        teeth: {
          orderBy: {
            toothNumber: 'asc',
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
            category: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Error al obtener orden' }, { status: 500 });
  }
}

// PATCH /api/lab-collaborator/orders/[orderId] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Only lab collaborator can update order status
    if (session.user.role !== Role.LAB_COLLABORATOR) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    const { orderId } = await params;
    const userRole = session.user.role as Role;
    const userId = session.user.id;

    // Get laboratory ID from session
    const laboratoryId = session.user.laboratoryId;
    if (!laboratoryId) {
      return NextResponse.json({ error: 'Usuario no asociado a un laboratorio' }, { status: 400 });
    }

    // Check user has access to this order
    const accessCheck = await checkOrderAccess({
      orderId,
      userId,
      userRole,
      laboratoryId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.statusCode });
    }

    // Validate request body
    const updateSchema = z.object({
      status: z.nativeEnum(OrderStatus),
      comment: z.string().optional(),
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

    const { status: newStatus, comment } = validatedData;

    // Validate that comment is provided when status is NEEDS_INFO
    if (newStatus === OrderStatus.NEEDS_INFO && (!comment || !comment.trim())) {
      return NextResponse.json(
        { error: 'Debes proporcionar un comentario cuando solicitas información' },
        { status: 400 }
      );
    }

    // Update order status using shared utility
    const updateResult = await updateOrderStatus({
      orderId,
      newStatus,
      userId,
      userRole,
      comment,
    });

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: updateResult.statusCode });
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
