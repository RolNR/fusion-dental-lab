import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/doctor/clinics
 * Returns all clinics that the doctor belongs to
 * @returns [{ id, name, isPrimary, isActive }]
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Fetch all clinics the doctor belongs to via DoctorClinic junction table
    const doctorClinics = await prisma.doctorClinic.findMany({
      where: {
        doctorId: session.user.id,
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' }, // Primary clinic first
        { createdAt: 'asc' }, // Then by creation order
      ],
    });

    // Get doctor's active clinic ID
    const doctor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { activeClinicId: true },
    });

    // Map to response format
    const clinics = doctorClinics.map((dc) => ({
      id: dc.clinic.id,
      name: dc.clinic.name,
      isPrimary: dc.isPrimary,
      isActive: dc.clinic.isActive,
      isCurrent: dc.clinic.id === doctor?.activeClinicId,
    }));

    return NextResponse.json({ clinics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching doctor clinics:', error);
    return NextResponse.json({ error: 'Error al cargar clínicas' }, { status: 500 });
  }
}
