import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/assistant/doctors - Get doctors assigned to this assistant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const assignments = await prisma.doctorAssistant.findMany({
      where: {
        assistantId: session.user.id,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const doctors = assignments.map(a => a.doctor);

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Error fetching assigned doctors:', error);
    return NextResponse.json(
      { error: 'Error al cargar doctores' },
      { status: 500 }
    );
  }
}
