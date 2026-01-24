import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';

// POST /api/orders/[orderId]/comments - Create a new comment on an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { orderId } = await params;
    const userRole = session.user.role as Role;
    const userId = session.user.id;

    // Check user has access to this order
    const accessCheck = await checkOrderAccess({
      orderId,
      userId,
      userRole,
      laboratoryId: session.user.laboratoryId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.statusCode });
    }

    const isLabUser = userRole === Role.LAB_ADMIN || userRole === Role.LAB_COLLABORATOR;

    // Validate request body
    const commentSchema = z.object({
      content: z
        .string()
        .min(1, 'El comentario no puede estar vacío')
        .max(2000, 'El comentario es demasiado largo'),
      isInternal: z.boolean().optional().default(false),
    });

    const body = await request.json();
    let validatedData;

    try {
      validatedData = commentSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: err.issues },
          { status: 400 }
        );
      }
      throw err;
    }

    // Only lab users can create internal comments
    const isInternal = isLabUser && validatedData.isInternal;

    // Create the comment
    const comment = await prisma.orderComment.create({
      data: {
        content: validatedData.content,
        isInternal: isInternal,
        orderId: orderId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'OrderComment',
        entityId: comment.id,
        newValue: JSON.stringify({ content: comment.content, isInternal: comment.isInternal }),
        userId: userId,
        orderId: orderId,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Error al crear el comentario' }, { status: 500 });
  }
}

// GET /api/orders/[orderId]/comments - Get all comments for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { orderId } = await params;
    const userRole = session.user.role as Role;
    const userId = session.user.id;

    // Check user has access to this order
    const accessCheck = await checkOrderAccess({
      orderId,
      userId,
      userRole,
      laboratoryId: session.user.laboratoryId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.statusCode });
    }

    const isLabUser = userRole === Role.LAB_ADMIN || userRole === Role.LAB_COLLABORATOR;
    const isClinicUser = userRole === Role.DOCTOR;

    // Fetch comments - exclude internal comments for clinic users
    const comments = await prisma.orderComment.findMany({
      where: {
        orderId: orderId,
        ...(isClinicUser ? { isInternal: false } : {}), // Hide internal comments from clinic users
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Error al obtener los comentarios' }, { status: 500 });
  }
}
