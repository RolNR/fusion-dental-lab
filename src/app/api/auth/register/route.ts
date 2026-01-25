import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '@/lib/constants';
import { Role } from '@prisma/client';
import { logAuthEvent, getAuditContext } from '@/lib/audit';

const registerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  phone: z.string().optional(),
  clinicName: z.string().min(1, 'El nombre del consultorio es requerido'),
  clinicAddress: z.string().optional(),
  razonSocial: z.string().optional(),
  fiscalAddress: z.string().optional(),
});

// POST /api/auth/register - Public registration for doctors
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese correo electrónico' },
        { status: 409 }
      );
    }

    // Find the laboratory (single-tenant: there's only one)
    const laboratory = await prisma.laboratory.findFirst();

    if (!laboratory) {
      return NextResponse.json(
        { error: 'No se encontró un laboratorio configurado' },
        { status: 500 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_SALT_ROUNDS);

    // Create user as DOCTOR linked to the laboratory
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: Role.DOCTOR,
        doctorLaboratoryId: laboratory.id,
        phone: validatedData.phone || null,
        clinicName: validatedData.clinicName,
        clinicAddress: validatedData.clinicAddress || null,
        razonSocial: validatedData.razonSocial || null,
        fiscalAddress: validatedData.fiscalAddress || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Log registration event
    await logAuthEvent('REGISTER', user.id, user.email, {
      ...getAuditContext(request),
      metadata: { name: user.name, clinicName: validatedData.clinicName },
    });

    return NextResponse.json({ message: 'Cuenta creada exitosamente', user }, { status: 201 });
  } catch (error) {
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

    console.error('Error in registration:', error);
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }
}
