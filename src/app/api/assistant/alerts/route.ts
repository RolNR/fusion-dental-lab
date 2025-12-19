import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// GET /api/assistant/alerts - Get alerts for this assistant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== Role.CLINIC_ASSISTANT) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const alerts = await prisma.alert.findMany({
      where: {
        receiverId: session.user.id,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            patientName: true,
          },
        },
        sender: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return NextResponse.json(
      { error: 'Error al cargar alertas' },
      { status: 500 }
    );
  }
}
