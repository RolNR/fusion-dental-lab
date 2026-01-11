import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '@/lib/constants';

// Validation schema for updating an assistant
const updateAssistantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
});

// GET /api/clinic-admin/assistants/[assistantId] - Get specific assistant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await params;
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
      return NextResponse.json({ error: 'Usuario no asociado a una clínica' }, { status: 400 });
    }

    // Fetch assistant with assigned doctors
    const assistant = await prisma.user.findFirst({
      where: {
        id: assistantId,
        role: Role.CLINIC_ASSISTANT,
        assistantClinicId: clinicId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        assignedDoctors: {
          include: {
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

    if (!assistant) {
      return NextResponse.json({ error: 'Asistente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ assistant }, { status: 200 });
  } catch (error) {
    console.error('Error fetching assistant:', error);
    return NextResponse.json({ error: 'Error al obtener asistente' }, { status: 500 });
  }
}

// PATCH /api/clinic-admin/assistants/[assistantId] - Update assistant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await params;
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
      return NextResponse.json({ error: 'Usuario no asociado a una clínica' }, { status: 400 });
    }

    // Verify assistant belongs to this clinic
    const existingAssistant = await prisma.user.findFirst({
      where: {
        id: assistantId,
        role: Role.CLINIC_ASSISTANT,
        assistantClinicId: clinicId,
      },
    });

    if (!existingAssistant) {
      return NextResponse.json({ error: 'Asistente no encontrado' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateAssistantSchema.parse(body);

    // Check if email is already in use by another user
    if (validatedData.email && validatedData.email !== existingAssistant.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailInUse) {
        return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      passwordHash?: string;
    } = {
      name: validatedData.name,
      email: validatedData.email,
    };

    // Hash new password if provided
    if (validatedData.password) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_SALT_ROUNDS);
    }

    // Update assistant
    const assistant = await prisma.user.update({
      where: { id: assistantId },
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
        message: 'Asistente actualizado exitosamente',
        assistant,
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

    console.error('Error updating assistant:', error);
    return NextResponse.json({ error: 'Error al actualizar asistente' }, { status: 500 });
  }
}

// DELETE /api/clinic-admin/assistants/[assistantId] - Delete assistant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await params;
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
      return NextResponse.json({ error: 'Usuario no asociado a una clínica' }, { status: 400 });
    }

    // Verify assistant belongs to this clinic
    const existingAssistant = await prisma.user.findFirst({
      where: {
        id: assistantId,
        role: Role.CLINIC_ASSISTANT,
        assistantClinicId: clinicId,
      },
    });

    if (!existingAssistant) {
      return NextResponse.json({ error: 'Asistente no encontrado' }, { status: 404 });
    }

    // Delete assistant
    await prisma.user.delete({
      where: { id: assistantId },
    });

    return NextResponse.json({ message: 'Asistente eliminado exitosamente' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting assistant:', error);
    return NextResponse.json({ error: 'Error al eliminar asistente' }, { status: 500 });
  }
}
