import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// GET /api/lab-admin/orders/[orderId] - Get specific order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Check authorization (only LAB_ADMIN and LAB_COLLABORATOR)
    if (session.user.role !== Role.LAB_ADMIN && session.user.role !== Role.LAB_COLLABORATOR) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const laboratoryId = session.user.laboratoryId;
    if (!laboratoryId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a un laboratorio' },
        { status: 400 }
      );
    }

    // Fetch order with full details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        clinic: {
          laboratoryId, // Ensure order belongs to this laboratory
        },
      },
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
        files: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileType: true,
            fileSize: true,
            storageUrl: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Error al obtener orden' },
      { status: 500 }
    );
  }
}
