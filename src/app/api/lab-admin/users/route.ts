import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { BCRYPT_SALT_ROUNDS } from '@/lib/constants';

// Validation schema for creating users
const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['LAB_COLLABORATOR', 'DOCTOR']),
  // Doctor profile fields
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  phone: z.string().optional(),
  razonSocial: z.string().optional(),
  fiscalAddress: z.string().optional(),
});

// GET /api/lab-admin/users - List all users in the laboratory
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

    const laboratoryId = session.user.laboratoryId;
    if (!laboratoryId) {
      return NextResponse.json({ error: 'Usuario no asociado a un laboratorio' }, { status: 400 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    // Build where clause - get users in this laboratory
    const where: any = {
      OR: [{ labCollaboratorId: laboratoryId }, { doctorLaboratoryId: laboratoryId }],
    };

    if (roleFilter) {
      where.role = roleFilter as Role;
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        clinicName: true,
        clinicAddress: true,
        phone: true,
        razonSocial: true,
        fiscalAddress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

// POST /api/lab-admin/users - Create a new user
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

    const laboratoryId = session.user.laboratoryId;
    if (!laboratoryId) {
      return NextResponse.json({ error: 'Usuario no asociado a un laboratorio' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_SALT_ROUNDS);

    // Build user data based on role
    const userData: any = {
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: validatedData.role,
    };

    // Set appropriate foreign keys based on role
    if (validatedData.role === 'LAB_COLLABORATOR') {
      userData.labCollaboratorId = laboratoryId;
    } else if (validatedData.role === 'DOCTOR') {
      userData.doctorLaboratoryId = laboratoryId;
      userData.clinicName = validatedData.clinicName;
      userData.clinicAddress = validatedData.clinicAddress;
      userData.phone = validatedData.phone;
      userData.razonSocial = validatedData.razonSocial;
      userData.fiscalAddress = validatedData.fiscalAddress;
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        clinicName: true,
        clinicAddress: true,
        phone: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        user,
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

    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
