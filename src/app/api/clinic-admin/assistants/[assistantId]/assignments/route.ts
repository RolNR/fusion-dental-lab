import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

const assignmentsSchema = z.object({
  doctorIds: z.array(z.string()).min(0, 'La lista de doctores es requerida'),
});

// PUT /api/clinic-admin/assistants/[assistantId]/assignments - Update all doctor assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

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

    // Verify assistant belongs to this clinic
    const assistant = await prisma.user.findFirst({
      where: {
        id: assistantId,
        role: Role.CLINIC_ASSISTANT,
        assistantClinicId: clinicId,
      },
    });

    if (!assistant) {
      return NextResponse.json(
        { error: 'Asistente no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = assignmentsSchema.parse(body);

    // Verify all doctors belong to this clinic
    if (validatedData.doctorIds.length > 0) {
      // Check via DoctorClinic junction table
      const doctorMemberships = await prisma.doctorClinic.findMany({
        where: {
          doctorId: { in: validatedData.doctorIds },
          clinicId: clinicId,
        },
      });

      if (doctorMemberships.length !== validatedData.doctorIds.length) {
        return NextResponse.json(
          { error: 'Uno o más doctores no pertenecen a esta clínica' },
          { status: 400 }
        );
      }
    }

    // Perform atomic batch update using transaction
    await prisma.$transaction(async (tx) => {
      // Delete all existing assignments
      await tx.doctorAssistant.deleteMany({
        where: {
          assistantId,
        },
      });

      // Create new assignments if there are any
      if (validatedData.doctorIds.length > 0) {
        await tx.doctorAssistant.createMany({
          data: validatedData.doctorIds.map((doctorId) => ({
            doctorId,
            assistantId,
          })),
        });
      }
    });

    return NextResponse.json(
      {
        message: 'Asignaciones actualizadas exitosamente',
        assignedCount: validatedData.doctorIds.length,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: err.issues },
        { status: 400 }
      );
    }

    console.error('Error updating doctor assignments:', err);
    return NextResponse.json(
      { error: 'Error al actualizar asignaciones' },
      { status: 500 }
    );
  }
}
