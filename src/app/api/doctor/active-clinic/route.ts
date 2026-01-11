import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getAuditContext } from '@/lib/audit';

const activeClinicSchema = z.object({
  clinicId: z.string().min(1, 'ID de clínica requerido'),
});

/**
 * POST /api/doctor/active-clinic
 * Updates the doctor's active clinic
 * @body { clinicId: string }
 * @returns { success: true }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = activeClinicSchema.parse(body);

    // Verify doctor belongs to this clinic
    const membership = await prisma.doctorClinic.findUnique({
      where: {
        doctorId_clinicId: {
          doctorId: session.user.id,
          clinicId: validatedData.clinicId,
        },
      },
      include: {
        clinic: {
          select: {
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No tienes acceso a esta clínica' }, { status: 403 });
    }

    if (!membership.clinic.isActive) {
      return NextResponse.json({ error: 'Esta clínica no está activa' }, { status: 400 });
    }

    // Get old active clinic for audit log
    const oldUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { activeClinicId: true },
    });

    // Update doctor's active clinic
    await prisma.user.update({
      where: { id: session.user.id },
      data: { activeClinicId: validatedData.clinicId },
    });

    // Log clinic switch
    await createAuditLog({
      action: 'UPDATE',
      userId: session.user.id,
      entityType: 'User',
      entityId: session.user.id,
      oldValue: { activeClinicId: oldUser?.activeClinicId },
      newValue: { activeClinicId: validatedData.clinicId },
      metadata: {
        action: 'CLINIC_SWITCH',
        clinicName: membership.clinic.name,
      },
      ...getAuditContext(request),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating active clinic:', error);
    return NextResponse.json({ error: 'Error al cambiar clínica' }, { status: 500 });
  }
}
