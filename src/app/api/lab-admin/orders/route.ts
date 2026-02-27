import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, OrderStatus } from '@prisma/client';
import { z } from 'zod';
import { buildOrderWhereClause } from '@/lib/api/orderFilters';

const queryParamsSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  includeDeleted: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

// GET /api/lab-admin/orders - Get all orders for the laboratory
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Check authorization (only LAB_ADMIN)
    if (session.user.role !== Role.LAB_ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const laboratoryId = session.user.laboratoryId;
    if (!laboratoryId) {
      return NextResponse.json({ error: 'Usuario no asociado a un laboratorio' }, { status: 400 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const result = queryParamsSchema.safeParse({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      includeDeleted: searchParams.get('includeDeleted') || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: result.error.issues },
        { status: 400 }
      );
    }

    const { search, status, page, limit, includeDeleted } = result.data;

    // Build where clause using shared utility
    const where = buildOrderWhereClause({
      search,
      status,
      laboratoryId,
      includeDeleted,
    });

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });

    // Fetch orders with pagination
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
        teeth: {
          select: {
            toothNumber: true,
            tipoRestauracion: true,
            material: true,
          },
        },
        pruebas: {
          select: {
            id: true,
            tipo: true,
            completada: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json(
      {
        orders,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
  }
}
