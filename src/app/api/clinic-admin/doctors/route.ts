import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '@/lib/constants';

// Validation schema for creating/updating a doctor
const doctorSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
});

// GET /api/clinic-admin/doctors - Get all doctors for the clinic
export async function GET() {
  try {
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

    // Fetch all doctors for this clinic via DoctorClinic junction table
    const doctorMemberships = await prisma.doctorClinic.findMany({
      where: {
        clinicId: clinicId,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const doctors = doctorMemberships.map((m) => m.doctor);

    return NextResponse.json({ doctors }, { status: 200 });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Error al obtener doctores' },
      { status: 500 }
    );
  }
}

// POST /api/clinic-admin/doctors - Create a new doctor
export async function POST(request: NextRequest) {
  try {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = doctorSchema.parse(body);

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está en uso' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password!, BCRYPT_SALT_ROUNDS);

    // Create doctor with DoctorClinic membership (atomic transaction)
    const doctor = await prisma.$transaction(async (tx) => {
      const newDoctor = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          passwordHash,
          role: Role.DOCTOR,
          activeClinicId: clinicId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Create DoctorClinic membership
      await tx.doctorClinic.create({
        data: {
          doctorId: newDoctor.id,
          clinicId: clinicId,
          isPrimary: true,
        },
      });

      return newDoctor;
    });

    return NextResponse.json(
      {
        message: 'Doctor creado exitosamente',
        doctor,
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

    console.error('Error creating doctor:', error);
    return NextResponse.json(
      { error: 'Error al crear doctor' },
      { status: 500 }
    );
  }
}
