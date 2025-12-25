import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { orderUpdateSchema, type OrderUpdateData } from '@/types/order';
import { canEditOrder, canDeleteOrder } from '@/lib/api/orderEditValidation';
import { orderDetailInclude } from '@/lib/api/orderQueries';

// GET /api/assistant/orders/[orderId] - Get a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: orderDetailInclude,
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Verify the assistant is assigned to this doctor
    const assignment = await prisma.doctorAssistant.findUnique({
      where: {
        doctorId_assistantId: {
          doctorId: order.doctorId,
          assistantId: session.user.id,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Error al cargar orden' },
      { status: 500 }
    );
  }
}

// PATCH /api/assistant/orders/[orderId] - Update an order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { orderId } = await params;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Verify the assistant is assigned to this doctor
    const assignment = await prisma.doctorAssistant.findUnique({
      where: {
        doctorId_assistantId: {
          doctorId: existingOrder.doctorId,
          assistantId: session.user.id,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if order can be edited
    const editCheck = canEditOrder(existingOrder.status);
    if (!editCheck.canEdit) {
      return NextResponse.json({ error: editCheck.error }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = orderUpdateSchema.parse(body);

    const updateData: OrderUpdateData = validatedData;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
        doctor: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: err.issues },
        { status: 400 }
      );
    }

    console.error('Error updating order:', err);
    return NextResponse.json(
      { error: 'Error al actualizar orden' },
      { status: 500 }
    );
  }
}

// DELETE /api/assistant/orders/[orderId] - Delete a draft order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { orderId } = await params;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Verify the assistant is assigned to this doctor
    const assignment = await prisma.doctorAssistant.findUnique({
      where: {
        doctorId_assistantId: {
          doctorId: existingOrder.doctorId,
          assistantId: session.user.id,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if order can be deleted
    const deleteCheck = canDeleteOrder(existingOrder.status);
    if (!deleteCheck.canDelete) {
      return NextResponse.json({ error: deleteCheck.error }, { status: 400 });
    }

    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Error al eliminar orden' },
      { status: 500 }
    );
  }
}
