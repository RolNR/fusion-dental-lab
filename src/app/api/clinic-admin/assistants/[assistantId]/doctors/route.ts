import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

const assignDoctorSchema = z.object({
  doctorId: z.string().min(1, 'El ID del doctor es requerido'),
});

// POST /api/clinic-admin/assistants/[assistantId]/doctors - Assign doctor to assistant
export async function POST(
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

    const body = await request.json();
    const validatedData = assignDoctorSchema.parse(body);

    // Verify doctor belongs to this clinic via DoctorClinic junction table
    const doctorMembership = await prisma.doctorClinic.findUnique({
      where: {
        doctorId_clinicId: {
          doctorId: validatedData.doctorId,
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

    // Check if assignment already exists
    const existingAssignment = await prisma.doctorAssistant.findUnique({
      where: {
        doctorId_assistantId: {
          doctorId: validatedData.doctorId,
          assistantId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'El doctor ya está asignado a este asistente' },
        { status: 400 }
      );
    }

    // Create assignment
    await prisma.doctorAssistant.create({
      data: {
        doctorId: validatedData.doctorId,
        assistantId,
      },
    });

    return NextResponse.json({ message: 'Doctor asignado exitosamente' }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }

    console.error('Error assigning doctor to assistant:', err);
    return NextResponse.json({ error: 'Error al asignar doctor' }, { status: 500 });
  }
}
