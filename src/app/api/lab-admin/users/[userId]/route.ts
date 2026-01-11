import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { BCRYPT_SALT_ROUNDS } from '@/lib/constants';

// Validation schema for updating users
const updateUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
});

// GET /api/lab-admin/users/[userId] - Get specific user details
export async function GET(
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
      return NextResponse.json({ error: 'Usuario no asociado a un laboratorio' }, { status: 400 });
    }

    // Fetch user
    // Check if user is a doctor in any clinic of this laboratory
    const doctorInLab = await prisma.doctorClinic.findFirst({
      where: {
        doctorId: userId,
        clinic: { laboratoryId },
      },
    });

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        OR: [
          { labCollaboratorId: laboratoryId },
          { clinic: { laboratoryId } },
          ...(doctorInLab ? [{ id: userId }] : []),
          { assistantClinic: { laboratoryId } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
        clinicMemberships: {
          select: {
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
            isPrimary: true,
          },
        },
        assistantClinic: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedDoctors: {
          select: {
            doctor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

// PATCH /api/lab-admin/users/[userId] - Update user
export async function PATCH(
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
      return NextResponse.json({ error: 'Usuario no asociado a un laboratorio' }, { status: 400 });
    }

    // Verify user belongs to this laboratory
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        OR: [
          { labCollaboratorId: laboratoryId },
          { clinic: { laboratoryId } },
          { clinicMemberships: { some: { clinic: { laboratoryId } } } },
          { assistantClinic: { laboratoryId } },
        ],
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Cannot edit LAB_ADMIN users
    if (existingUser.role === 'LAB_ADMIN') {
      return NextResponse.json(
        { error: 'No se puede editar un administrador del laboratorio' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check email uniqueness if email is being changed
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.password) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_SALT_ROUNDS);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Usuario actualizado exitosamente',
        user,
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

    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE /api/lab-admin/users/[userId] - Delete user
export async function DELETE(
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
      return NextResponse.json({ error: 'Usuario no asociado a un laboratorio' }, { status: 400 });
    }

    // Verify user belongs to this laboratory
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        OR: [
          { labCollaboratorId: laboratoryId },
          { clinic: { laboratoryId } },
          { clinicMemberships: { some: { clinic: { laboratoryId } } } },
          { assistantClinic: { laboratoryId } },
        ],
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Cannot delete LAB_ADMIN users
    if (existingUser.role === 'LAB_ADMIN') {
      return NextResponse.json(
        { error: 'No se puede eliminar un administrador del laboratorio' },
        { status: 403 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
