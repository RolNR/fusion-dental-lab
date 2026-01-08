import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

// Validation schema for creating a clinic
const createClinicSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

// GET /api/lab-admin/clinics - List all clinics for this laboratory
export async function GET(request: NextRequest) {
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

    // Get laboratory ID from session
    const laboratoryId = session.user.laboratoryId;
    if (!laboratoryId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a un laboratorio' },
        { status: 400 }
      );
    }

    // Fetch all clinics for this laboratory
    const clinics = await prisma.clinic.findMany({
      where: {
        laboratoryId,
      },
      include: {
        _count: {
          select: {
            clinicAdmins: true,
            doctorMemberships: true,
            assistants: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ clinics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return NextResponse.json(
      { error: 'Error al obtener clínicas' },
      { status: 500 }
    );
  }
}

// POST /api/lab-admin/clinics - Create a new clinic
export async function POST(request: NextRequest) {
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

    // Get laboratory ID from session
    const laboratoryId = session.user.laboratoryId;
    if (!laboratoryId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a un laboratorio' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createClinicSchema.parse(body);

    // Create clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        laboratoryId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            clinicAdmins: true,
            doctorMemberships: true,
            assistants: true,
            orders: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Clínica creada exitosamente',
        clinic,
      },
      { status: 201 }
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

    console.error('Error creating clinic:', error);
    return NextResponse.json(
      { error: 'Error al crear clínica' },
      { status: 500 }
    );
  }
}
