import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import { orderCreateSchema } from '@/types/order';
import { createOrderWithRetry } from '@/lib/api/orderCreation';
import { buildOrderWhereClause } from '@/lib/api/orderFilters';

const queryParamsSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
});

// GET /api/doctor/orders - Get all orders for the logged-in doctor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
      doctorId: session.user.id,
    });

    const orders = await prisma.order.findMany({
      where,
      include: {
        clinic: {
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
    console.error('Error fetching doctor orders:', error);
    return NextResponse.json(
      { error: 'Error al cargar órdenes' },
      { status: 500 }
    );
  }
}

// POST /api/doctor/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = orderCreateSchema.parse(body);

    // Get doctor's clinic
    const doctor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { doctorClinicId: true },
    });

    if (!doctor?.doctorClinicId) {
      return NextResponse.json(
        { error: 'Doctor no asignado a una clínica' },
        { status: 400 }
      );
    }

    // Create order with retry logic for race conditions
    const order = await createOrderWithRetry({
      orderData: {
        ...validatedData,
        clinic: {
          connect: { id: doctor.doctorClinicId },
        },
        doctor: {
          connect: { id: session.user.id },
        },
        createdBy: {
          connect: { id: session.user.id },
        },
        status: 'DRAFT',
      },
      clinicId: doctor.doctorClinicId,
      patientName: validatedData.patientName,
    });

    // Fetch the created order with clinic info
    const orderWithClinic = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ order: orderWithClinic }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: err.issues },
        { status: 400 }
      );
    }

    console.error('Error creating order:', err);
    return NextResponse.json(
      { error: 'Error al crear orden' },
      { status: 500 }
    );
  }
}
