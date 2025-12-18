import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// GET /api/clinic-admin/stats - Get clinic statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Check authorization (only CLINIC_ADMIN)
    if (session.user.role !== Role.CLINIC_ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const clinicId = session.user.clinicId;
    if (!clinicId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a una clínica' },
        { status: 400 }
      );
    }

    // Fetch clinic with counts
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        _count: {
          select: {
            clinicAdmins: true,
            doctors: true,
            assistants: true,
            orders: true,
          },
        },
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: 'Clínica no encontrada' },
        { status: 404 }
      );
    }

    // Get order stats by status
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where: {
        clinicId,
      },
      _count: true,
    });

    const stats = {
      clinic,
      ordersByStatus: orderStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching clinic stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
