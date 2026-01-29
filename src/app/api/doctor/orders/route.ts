import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, Prisma, OrderStatus } from '@prisma/client';
import { orderDraftSchema, orderCreateSchema } from '@/types/order';
import { createOrderWithRetry } from '@/lib/api/orderCreation';
import { DEFAULT_PAGE_SIZE, MAX_DRAFTS_PER_DOCTOR } from '@/lib/constants';
import { z } from 'zod';

// GET /api/doctor/orders - Get all orders for the logged-in doctor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Check authorization
    if (session.user.role !== Role.DOCTOR) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const statusParam = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10);

    // Validate status filter against OrderStatus enum
    const validStatus =
      statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)
        ? (statusParam as OrderStatus)
        : undefined;

    // Build where clause
    const where: Prisma.OrderWhereInput = {
      doctorId: session.user.id,
      deletedAt: null, // Exclude soft-deleted orders
      ...(search && {
        OR: [
          { patientName: { contains: search, mode: 'insensitive' } },
          { orderNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(validStatus && { status: validStatus }),
    };

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });

    // Fetch orders for this doctor with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            clinicName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        orders,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
  }
}

// POST /api/doctor/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Check authorization
    if (session.user.role !== Role.DOCTOR) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const doctorId = session.user.id;

    // Check draft limit before creating a new order
    const draftCount = await prisma.order.count({
      where: {
        doctorId,
        status: 'DRAFT',
      },
    });

    if (draftCount >= MAX_DRAFTS_PER_DOCTOR) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${MAX_DRAFTS_PER_DOCTOR} borradores. Por favor, envía o elimina algunos borradores antes de crear uno nuevo.`,
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Determine if draft or full order
    const isDraft = body.patientName === undefined || body.patientName === '';
    const schema = isDraft ? orderDraftSchema : orderCreateSchema;
    const validatedData = schema.parse(body);

    // Extract teeth data before creating order
    const { teeth, ...orderFields } = validatedData;
    const patientName = orderFields.patientName || '';

    // Create order with retry logic for order number conflicts
    const order = await createOrderWithRetry({
      orderData: {
        ...orderFields,
        patientName,
        doctor: { connect: { id: doctorId } },
        createdBy: { connect: { id: doctorId } },
        status: 'DRAFT',
        ...(teeth && teeth.length > 0
          ? {
              teeth: {
                create: teeth.map((tooth) => ({
                  toothNumber: tooth.toothNumber,
                  material: tooth.material,
                  colorInfo: tooth.colorInfo,
                  tipoRestauracion: tooth.tipoRestauracion,
                  trabajoSobreImplante: tooth.trabajoSobreImplante,
                  informacionImplante: tooth.informacionImplante,
                })),
              },
            }
          : {}),
      },
      doctorId,
      patientName: validatedData.patientName || 'borrador',
    });

    return NextResponse.json({ message: 'Orden creada exitosamente', order }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Error al crear orden' }, { status: 500 });
  }
}
