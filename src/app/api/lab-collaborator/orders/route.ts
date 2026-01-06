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
});

// GET /api/lab-collaborator/orders - Get all orders for this laboratory
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Check authorization (only LAB_COLLABORATOR)
    if (session.user.role !== Role.LAB_COLLABORATOR) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Get laboratory ID from session
    const laboratoryId = session.user.laboratoryId;
    if (!laboratoryId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a un laboratorio' },
        { status: 400 }
      );
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
      laboratoryId,
    });

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
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
    return NextResponse.json(
      { error: 'Error al obtener órdenes' },
      { status: 500 }
    );
  }
}
