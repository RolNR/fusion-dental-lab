import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/doctor/alerts - Get all alerts for the logged-in doctor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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
    return NextResponse.json({ error: 'Error al cargar alertas' }, { status: 500 });
  }
}
