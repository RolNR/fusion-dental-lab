import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '@/lib/constants';

// Validation schema for updating a doctor
const updateDoctorSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
});

// GET /api/clinic-admin/doctors/[doctorId] - Get specific doctor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;
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

    // Fetch doctor
    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: Role.DOCTOR,
        doctorClinicId: clinicId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ doctor }, { status: 200 });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json(
      { error: 'Error al obtener doctor' },
      { status: 500 }
    );
  }
}

// PATCH /api/clinic-admin/doctors/[doctorId] - Update doctor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;
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

    // Verify doctor belongs to this clinic
    const existingDoctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: Role.DOCTOR,
        doctorClinicId: clinicId,
      },
    });

    if (!existingDoctor) {
      return NextResponse.json(
        { error: 'Doctor no encontrado' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateDoctorSchema.parse(body);

    // Check if email is already in use by another user
    if (validatedData.email && validatedData.email !== existingDoctor.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name: validatedData.name,
      email: validatedData.email,
    };

    // Hash new password if provided
    if (validatedData.password) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_SALT_ROUNDS);
    }

    // Update doctor
    const doctor = await prisma.user.update({
      where: { id: doctorId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Doctor actualizado exitosamente',
        doctor,
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

    console.error('Error updating doctor:', error);
    return NextResponse.json(
      { error: 'Error al actualizar doctor' },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic-admin/doctors/[doctorId] - Delete doctor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;
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

    // Verify doctor belongs to this clinic
    const existingDoctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: Role.DOCTOR,
        doctorClinicId: clinicId,
      },
    });

    if (!existingDoctor) {
      return NextResponse.json(
        { error: 'Doctor no encontrado' },
        { status: 404 }
      );
    }

    // Delete doctor
    await prisma.user.delete({
      where: { id: doctorId },
    });

    return NextResponse.json(
      { message: 'Doctor eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json(
      { error: 'Error al eliminar doctor' },
      { status: 500 }
    );
  }
}
