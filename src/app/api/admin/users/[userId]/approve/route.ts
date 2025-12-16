import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuthEvent, getAuditContext } from '@/lib/audit';
import { Role } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId } = await params;

    // Find the user to approve
    const userToApprove = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToApprove) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userToApprove.isApproved) {
      return NextResponse.json(
        { error: 'User is already approved' },
        { status: 400 }
      );
    }

    // Approve the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedById: session.user.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        approvedAt: true,
        createdAt: true,
      },
    });

    // Log approval in audit log
    await logAuthEvent('USER_APPROVED', userId, updatedUser.email, {
      ...getAuditContext(request),
      metadata: {
        approvedUserId: userId,
        approvedUserEmail: updatedUser.email,
        approvedBy: session.user.email,
      },
    });

    return NextResponse.json(
      {
        message: 'User approved successfully',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('User approval error:', error);
    return NextResponse.json(
      { error: 'An error occurred while approving the user' },
      { status: 500 }
    );
  }
}
