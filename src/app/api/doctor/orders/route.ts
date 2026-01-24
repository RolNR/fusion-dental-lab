import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { orderDraftSchema, orderCreateSchema } from '@/types/order';
import { createOrderWithRetry } from '@/lib/api/orderCreation';
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

    // Fetch orders for this doctor
    const orders = await prisma.order.findMany({
      where: {
        doctorId: session.user.id,
      },
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
    });

    return NextResponse.json({ orders }, { status: 200 });
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
                  materialBrand: tooth.materialBrand,
                  colorInfo: tooth.colorInfo,
                  tipoTrabajo: tooth.tipoTrabajo,
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
