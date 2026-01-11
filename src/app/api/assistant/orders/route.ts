import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import { assistantOrderCreateSchema } from '@/types/order';
import { createOrderWithRetry } from '@/lib/api/orderCreation';
import { buildOrderWhereClause } from '@/lib/api/orderFilters';

const queryParamsSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
});

// GET /api/assistant/orders - Get orders for doctors assigned to this assistant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get doctors assigned to this assistant
    const assignments = await prisma.doctorAssistant.findMany({
      where: {
        assistantId: session.user.id,
      },
      select: {
        doctorId: true,
      },
    });

    const doctorIds = assignments.map((a) => a.doctorId);

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const result = queryParamsSchema.safeParse({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: result.error.issues },
        { status: 400 }
      );
    }

    const { search, status } = result.data;

    // Build where clause using shared utility
    const where = buildOrderWhereClause({
      search,
      status,
      doctorIds,
    });

    const orders = await prisma.order.findMany({
      where,
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
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching assistant orders:', error);
    return NextResponse.json({ error: 'Error al cargar órdenes' }, { status: 500 });
  }
}

// POST /api/assistant/orders - Create a new order on behalf of a doctor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = assistantOrderCreateSchema.parse(body);

    // Verify assistant is assigned to this doctor
    const assignment = await prisma.doctorAssistant.findUnique({
      where: {
        doctorId_assistantId: {
          doctorId: validatedData.doctorId,
          assistantId: session.user.id,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear órdenes para este doctor' },
        { status: 403 }
      );
    }

    // Get doctor's active clinic
    const doctor = await prisma.user.findUnique({
      where: { id: validatedData.doctorId },
      select: { activeClinicId: true },
    });

    if (!doctor?.activeClinicId) {
      return NextResponse.json(
        { error: 'El doctor debe seleccionar una clínica primero' },
        { status: 400 }
      );
    }

    // Verify doctor belongs to the active clinic
    const membership = await prisma.doctorClinic.findUnique({
      where: {
        doctorId_clinicId: {
          doctorId: validatedData.doctorId,
          clinicId: doctor.activeClinicId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'El doctor no tiene acceso a la clínica activa' },
        { status: 403 }
      );
    }

    // Create order with retry logic for race conditions
    const order = await createOrderWithRetry({
      orderData: {
        ...validatedData,
        clinic: {
          connect: { id: doctor.activeClinicId },
        },
        doctor: {
          connect: { id: validatedData.doctorId },
        },
        createdBy: {
          connect: { id: session.user.id },
        },
        status: 'DRAFT',
      },
      clinicId: doctor.activeClinicId,
      patientName: validatedData.patientName,
    });

    // Fetch the created order with clinic and doctor info
    const orderWithDetails = await prisma.order.findUnique({
      where: { id: order.id },
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

    return NextResponse.json({ order: orderWithDetails }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }

    console.error('Error creating order:', err);
    return NextResponse.json({ error: 'Error al crear orden' }, { status: 500 });
  }
}
