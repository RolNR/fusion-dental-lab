import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { registerSchema } from '@/lib/validations/auth';
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
          message:
            'Registration submitted successfully. Please wait for admin approval to access your account.',
        },
        { status: 201 }
      );
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with isApproved: false
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        isApproved: false, // Requires admin approval
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
    });

    // Log registration in audit log
    await prisma.auditLog.create({
      data: {
        action: 'REGISTER',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        newValue: JSON.stringify({
          email: user.email,
          name: user.name,
          role: user.role,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json(
      {
        message:
          'Registration submitted successfully. Please wait for admin approval to access your account.',
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
          details: error.errors.map((err) => ({
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
