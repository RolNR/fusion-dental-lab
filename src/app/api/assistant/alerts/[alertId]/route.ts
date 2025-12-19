import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AlertStatus, Role } from '@prisma/client';

const alertUpdateSchema = z.object({
  status: z.nativeEnum(AlertStatus),
});

// PATCH /api/assistant/alerts/[alertId] - Update alert status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== Role.CLINIC_ASSISTANT) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { alertId } = await params;

    // Check if alert exists and belongs to this assistant
    const existingAlert = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alerta no encontrada' },
        { status: 404 }
      );
    }

    if (existingAlert.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado para modificar esta alerta' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = alertUpdateSchema.parse(body);

    // Build update data with timestamps
    const updateData: {
      status: AlertStatus;
      readAt?: Date;
      resolvedAt?: Date;
    } = {
      status: validatedData.status,
    };

    // Set readAt when transitioning from UNREAD to READ
    if (
      validatedData.status === AlertStatus.READ &&
      existingAlert.status === AlertStatus.UNREAD
    ) {
      updateData.readAt = new Date();
    }

    // Set both readAt and resolvedAt when marking as RESOLVED
    if (validatedData.status === AlertStatus.RESOLVED) {
      if (!existingAlert.readAt) {
        updateData.readAt = new Date();
      }
      updateData.resolvedAt = new Date();
    }

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: updateData,
    });

    return NextResponse.json({ alert });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: err.issues },
        { status: 400 }
      );
    }

    console.error('Error updating alert:', err);
    return NextResponse.json(
      { error: 'Error al actualizar alerta' },
      { status: 500 }
    );
  }
}
