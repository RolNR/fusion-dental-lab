import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

// Validation schema for clinic assignments
const clinicAssignmentSchema = z.object({
  clinicIds: z.array(z.string()).min(1, 'Debes seleccionar al menos una clínica'),
  primaryClinicId: z.string().min(1, 'Debes especificar una clínica principal'),
});

// PUT /api/lab-admin/users/[userId]/clinics - Batch update doctor clinic assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Check authorization (only LAB_ADMIN)
    if (session.user.role !== Role.LAB_ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const laboratoryId = session.user.laboratoryId;
    if (!laboratoryId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a un laboratorio' },
        { status: 400 }
      );
    }

    // Verify user exists and is a DOCTOR
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        activeClinicId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (user.role !== Role.DOCTOR) {
      return NextResponse.json(
        { error: 'Solo se pueden asignar clínicas a doctores' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = clinicAssignmentSchema.parse(body);

    // Validate primaryClinicId is in clinicIds
    if (!validatedData.clinicIds.includes(validatedData.primaryClinicId)) {
      return NextResponse.json(
        { error: 'La clínica principal debe estar en la lista de clínicas seleccionadas' },
        { status: 400 }
      );
    }

    // Verify all clinics belong to this laboratory
    const clinics = await prisma.clinic.findMany({
      where: {
        id: { in: validatedData.clinicIds },
        laboratoryId,
      },
      select: { id: true },
    });

    if (clinics.length !== validatedData.clinicIds.length) {
      return NextResponse.json(
        { error: 'Una o más clínicas no pertenecen a este laboratorio' },
        { status: 400 }
      );
    }

    // Atomic transaction: delete old assignments and create new ones
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing clinic memberships for this doctor
      await tx.doctorClinic.deleteMany({
        where: { doctorId: userId },
      });

      // 2. Create new memberships
      await tx.doctorClinic.createMany({
        data: validatedData.clinicIds.map((clinicId) => ({
          doctorId: userId,
          clinicId,
          isPrimary: clinicId === validatedData.primaryClinicId,
        })),
      });

      // 3. Update activeClinicId if necessary
      // If current activeClinicId is null or not in new clinic list, set to primary
      if (
        !user.activeClinicId ||
        !validatedData.clinicIds.includes(user.activeClinicId)
      ) {
        await tx.user.update({
          where: { id: userId },
          data: { activeClinicId: validatedData.primaryClinicId },
        });
      }
    });

    // Fetch updated memberships
    const updatedMemberships = await prisma.doctorClinic.findMany({
      where: { doctorId: userId },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(
      {
        message: 'Clínicas asignadas exitosamente',
        memberships: updatedMemberships.map((m) => ({
          clinic: m.clinic,
          isPrimary: m.isPrimary,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Error updating clinic assignments:', error);
    return NextResponse.json(
      { error: 'Error al actualizar asignaciones de clínicas' },
      { status: 500 }
    );
  }
}
