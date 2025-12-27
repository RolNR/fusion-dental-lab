import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, OrderStatus } from '@prisma/client';

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

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as OrderStatus | null;

    // Build where clause
    const whereClause: any = {
      clinic: {
        laboratoryId,
      },
    };

    // Add status filter if provided
    if (statusFilter && Object.values(OrderStatus).includes(statusFilter)) {
      whereClause.status = statusFilter;
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: whereClause,
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
