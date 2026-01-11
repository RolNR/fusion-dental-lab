import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AlertStatus, Role } from '@prisma/client';
import { deleteAlert } from '@/lib/api/alertActions';

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
      return NextResponse.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }

    console.error('Error updating alert:', err);
    return NextResponse.json({ error: 'Error al actualizar alerta' }, { status: 500 });
  }
}

// DELETE /api/doctor/alerts/[alertId] - Delete a resolved alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { alertId } = await params;

    const result = await deleteAlert({
      alertId,
      userId: session.user.id,
      userRole: Role.DOCTOR,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode || 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting alert:', err);
    return NextResponse.json({ error: 'Error al eliminar alerta' }, { status: 500 });
  }
}
