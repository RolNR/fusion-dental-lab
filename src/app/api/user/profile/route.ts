import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createAuditLog, getAuditContext } from '@/lib/audit';
import { profileUpdateSchema } from '@/lib/schemas/userSchemas';
import {
  AUTH_ERRORS,
  PROFILE_ERRORS,
  VALIDATION_ERRORS,
  GENERIC_ERRORS,
  SUCCESS_MESSAGES,
} from '@/lib/constants/errorMessages';

export async function PUT(request: NextRequest) {
  try {
    // Check authentication using helper
    const session = await requireAuth();
    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: AUTH_ERRORS.USER_NOT_FOUND }, { status: 404 });
    }

    // If email is changing, check if new email is already taken
    if (validatedData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json({ error: PROFILE_ERRORS.EMAIL_IN_USE }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: {
      name: string;
      email: string;
      passwordHash?: string;
    } = {
      name: validatedData.name,
      email: validatedData.email,
    };

    // Handle password change if requested
    if (validatedData.currentPassword && validatedData.newPassword) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.passwordHash
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: PROFILE_ERRORS.INVALID_CURRENT_PASSWORD },
          { status: 400 }
        );
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(validatedData.newPassword, salt);
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Log the update
    await createAuditLog({
      action: 'UPDATE',
      userId,
      entityType: 'User',
      entityId: userId,
      metadata: {
        email: validatedData.email,
        fieldsUpdated: Object.keys(updateData),
        passwordChanged: !!updateData.passwordHash,
      },
      ...getAuditContext(request),
    });

    return NextResponse.json(
      {
        message: SUCCESS_MESSAGES.PROFILE_UPDATED,
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: VALIDATION_ERRORS.VALIDATION_FAILED,
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Error updating profile:', error);
    return NextResponse.json({ error: GENERIC_ERRORS.INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}
