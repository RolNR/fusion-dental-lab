import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AlertStatus } from '@prisma/client';

const alertUpdateSchema = z.object({
  status: z.nativeEnum(AlertStatus),
});

// PATCH /api/doctor/alerts/[alertId] - Mark alert as read or resolved
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { alertId } = await params;

    // Check if alert exists and belongs to this doctor
    const existingAlert = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
    }

    if (existingAlert.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = alertUpdateSchema.parse(body);

    const updateData: {
      status: AlertStatus;
      readAt?: Date;
      resolvedAt?: Date;
    } = {
      status: validatedData.status,
    };

    // Set timestamps based on status
    if (validatedData.status === 'READ' && existingAlert.status === 'UNREAD') {
      updateData.readAt = new Date();
    }

    if (validatedData.status === 'RESOLVED') {
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
