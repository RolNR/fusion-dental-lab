import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const orderUpdateSchema = z.object({
  patientName: z.string().min(1).optional(),
  patientId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  teethNumbers: z.string().optional(),
  material: z.string().optional(),
  materialBrand: z.string().optional(),
  color: z.string().optional(),
  scanType: z.enum(['DIGITAL', 'PHYSICAL', 'NONE']).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

// GET /api/assistant/orders/[orderId] - Get a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: params.orderId,
      },
      include: {
        clinic: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            role: true,
          },
        },
        files: true,
      },
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
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.orderId },
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

    // Only allow editing DRAFT orders
    if (existingOrder.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Solo se pueden editar órdenes en borrador' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = orderUpdateSchema.parse(body);

    const order = await prisma.order.update({
      where: { id: params.orderId },
      data: validatedData,
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden' },
      { status: 500 }
    );
  }
}

// DELETE /api/assistant/orders/[orderId] - Delete a draft order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.orderId },
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

    // Only allow deleting DRAFT orders
    if (existingOrder.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar órdenes en borrador' },
        { status: 400 }
      );
    }

    await prisma.order.delete({
      where: { id: params.orderId },
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
