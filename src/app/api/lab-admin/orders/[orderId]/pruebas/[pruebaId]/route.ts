import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';

const pruebaUpdateSchema = z.object({
  completada: z.boolean(),
  nota: z.string().optional(),
});

// PATCH /api/lab-admin/orders/[orderId]/pruebas/[pruebaId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; pruebaId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== Role.LAB_ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { orderId, pruebaId } = await params;

    const accessCheck = await checkOrderAccess({
      orderId,
      userId: session.user.id,
      userRole: session.user.role as Role,
      laboratoryId: session.user.laboratoryId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.statusCode });
    }

    const existing = await prisma.pruebaRecord.findUnique({
      where: { id: pruebaId },
    });

    if (!existing || existing.orderId !== orderId) {
      return NextResponse.json({ error: 'Prueba no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    let validatedData;

    try {
      validatedData = pruebaUpdateSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: err.issues },
          { status: 400 }
        );
      }
      throw err;
    }

    const prueba = await prisma.pruebaRecord.update({
      where: { id: pruebaId },
      data: {
        completada: validatedData.completada,
        registradaAt: validatedData.completada ? (existing.registradaAt ?? new Date()) : null,
        ...(validatedData.nota !== undefined && { nota: validatedData.nota }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ prueba }, { status: 200 });
  } catch (error) {
    console.error('Error updating prueba:', error);
    return NextResponse.json({ error: 'Error al actualizar prueba' }, { status: 500 });
  }
}

// DELETE /api/lab-admin/orders/[orderId]/pruebas/[pruebaId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; pruebaId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== Role.LAB_ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { orderId, pruebaId } = await params;

    const accessCheck = await checkOrderAccess({
      orderId,
      userId: session.user.id,
      userRole: session.user.role as Role,
      laboratoryId: session.user.laboratoryId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.statusCode });
    }

    const existing = await prisma.pruebaRecord.findUnique({
      where: { id: pruebaId },
    });

    if (!existing || existing.orderId !== orderId) {
      return NextResponse.json({ error: 'Prueba no encontrada' }, { status: 404 });
    }

    await prisma.pruebaRecord.delete({ where: { id: pruebaId } });

    return NextResponse.json({ message: 'Prueba eliminada' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting prueba:', error);
    return NextResponse.json({ error: 'Error al eliminar prueba' }, { status: 500 });
  }
}
