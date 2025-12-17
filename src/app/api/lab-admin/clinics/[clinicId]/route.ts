import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

// Validation schema for updating a clinic
const updateClinicSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/lab-admin/clinics/[clinicId] - Get specific clinic details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
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

    // Fetch clinic with full details
    const clinic = await prisma.clinic.findFirst({
      where: {
        id: clinicId,
        laboratoryId, // Ensure clinic belongs to this laboratory
      },
      include: {
        clinicAdmins: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        doctors: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        assistants: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
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

    return NextResponse.json({ clinic }, { status: 200 });
  } catch (error) {
    console.error('Error fetching clinic:', error);
    return NextResponse.json(
      { error: 'Error al obtener clínica' },
      { status: 500 }
    );
  }
}

// PATCH /api/lab-admin/clinics/[clinicId] - Update clinic
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
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

    // Verify clinic belongs to this laboratory
    const existingClinic = await prisma.clinic.findFirst({
      where: {
        id: clinicId,
        laboratoryId,
      },
    });

    if (!existingClinic) {
      return NextResponse.json(
        { error: 'Clínica no encontrada' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateClinicSchema.parse(body);

    // Update clinic
    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: validatedData,
      include: {
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

    return NextResponse.json(
      {
        message: 'Clínica actualizada exitosamente',
        clinic,
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

    console.error('Error updating clinic:', error);
    return NextResponse.json(
      { error: 'Error al actualizar clínica' },
      { status: 500 }
    );
  }
}

// DELETE /api/lab-admin/clinics/[clinicId] - Delete clinic (soft delete by setting isActive to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
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

    // Verify clinic belongs to this laboratory
    const existingClinic = await prisma.clinic.findFirst({
      where: {
        id: clinicId,
        laboratoryId,
      },
    });

    if (!existingClinic) {
      return NextResponse.json(
        { error: 'Clínica no encontrada' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.clinic.update({
      where: { id: clinicId },
      data: { isActive: false },
    });

    return NextResponse.json(
      { message: 'Clínica desactivada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting clinic:', error);
    return NextResponse.json(
      { error: 'Error al eliminar clínica' },
      { status: 500 }
    );
  }
}
