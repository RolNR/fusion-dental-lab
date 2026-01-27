import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

// Validation schema for updating laboratory
const updateLaboratorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

// GET /api/lab-admin/laboratory - Get laboratory details
export async function GET() {
  try {
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

    // Fetch laboratory
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: laboratoryId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    if (!laboratory) {
      return NextResponse.json({ error: 'Laboratorio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ laboratory }, { status: 200 });
  } catch (error) {
    console.error('Error fetching laboratory:', error);
    return NextResponse.json({ error: 'Error al obtener laboratorio' }, { status: 500 });
  }
}

// PATCH /api/lab-admin/laboratory - Update laboratory details
export async function PATCH(request: NextRequest) {
  try {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateLaboratorySchema.parse(body);

    // Update laboratory
    const laboratory = await prisma.laboratory.update({
      where: { id: laboratoryId },
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Laboratorio actualizado exitosamente',
        laboratory,
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

    console.error('Error updating laboratory:', error);
    return NextResponse.json({ error: 'Error al actualizar laboratorio' }, { status: 500 });
  }
}
