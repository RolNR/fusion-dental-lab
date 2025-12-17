import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { registerSchema } from '@/lib/validations/auth';
import { logAuthEvent, getAuditContext } from '@/lib/audit';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = registerSchema.parse(body);
    const { email, password, name, role } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Security: Don't reveal if email exists to prevent enumeration
      // Return same message as success for security
      return NextResponse.json(
        {
          message: 'Registro exitoso. Ya puedes iniciar sesión.',
        },
        { status: 201 }
      );
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user (no approval needed)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Log registration in audit log
    await logAuthEvent('REGISTER', user.id, user.email, {
      ...getAuditContext(request),
      metadata: {
        name: user.name,
        role: user.role,
      },
    });

    return NextResponse.json(
      {
        message: 'Registro exitoso. Ya puedes iniciar sesión.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle database errors
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
