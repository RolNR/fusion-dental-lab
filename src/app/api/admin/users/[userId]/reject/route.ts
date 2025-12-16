import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    const { userId } = params;

    // Find the user to reject
    const userToReject = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
      },
    });

    if (!userToReject) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userToReject.isApproved) {
      return NextResponse.json(
        { error: 'Cannot reject an already approved user. Consider deactivating instead.' },
        { status: 400 }
      );
    }

    // Log rejection BEFORE deleting user (so we have userId available)
    await prisma.auditLog.create({
      data: {
        action: 'USER_REJECTED',
        entityType: 'User',
        entityId: userId,
        userId: session.user.id,
        oldValue: JSON.stringify({
          rejectedUserId: userId,
          rejectedUserEmail: userToReject.email,
          rejectedUserName: userToReject.name,
          rejectedUserRole: userToReject.role,
          rejectedBy: session.user.email,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Delete the user (rejection = removal from system)
    // Note: Could be changed to soft delete with status field in future
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json(
      {
        message: 'User rejected and removed successfully',
        rejectedUser: {
          id: userToReject.id,
          email: userToReject.email,
          name: userToReject.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('User rejection error:', error);
    return NextResponse.json(
      { error: 'An error occurred while rejecting the user' },
      { status: 500 }
    );
  }
}
