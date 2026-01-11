import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// DELETE /api/clinic-admin/assistants/[assistantId]/doctors/[doctorId] - Remove doctor from assistant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string; doctorId: string }> }
) {
  try {
    const { assistantId, doctorId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== Role.CLINIC_ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const clinicId = session.user.clinicId;
    if (!clinicId) {
      return NextResponse.json({ error: 'Usuario no asociado a una clínica' }, { status: 400 });
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
      return NextResponse.json({ error: 'Asistente no encontrado' }, { status: 404 });
    }

    // Verify doctor belongs to this clinic via DoctorClinic junction table
    const doctorMembership = await prisma.doctorClinic.findUnique({
      where: {
        doctorId_clinicId: {
          doctorId: doctorId,
          clinicId: clinicId,
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!doctorMembership || doctorMembership.doctor.role !== Role.DOCTOR) {
      return NextResponse.json({ error: 'Doctor no encontrado en esta clínica' }, { status: 404 });
    }

    // Check if assignment exists
    const existingAssignment = await prisma.doctorAssistant.findUnique({
      where: {
        doctorId_assistantId: {
          doctorId,
          assistantId,
        },
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'El doctor no está asignado a este asistente' },
        { status: 404 }
      );
    }

    // Delete assignment
    await prisma.doctorAssistant.delete({
      where: {
        doctorId_assistantId: {
          doctorId,
          assistantId,
        },
      },
    });

    return NextResponse.json({ message: 'Doctor removido exitosamente' }, { status: 200 });
  } catch (err) {
    console.error('Error removing doctor from assistant:', err);
    return NextResponse.json({ error: 'Error al remover doctor' }, { status: 500 });
  }
}
