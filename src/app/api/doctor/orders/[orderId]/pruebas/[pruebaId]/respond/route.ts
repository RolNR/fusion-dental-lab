import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';
import eventBus from '@/lib/sse/eventBus';

const respondSchema = z.object({
  aprobada: z.boolean(),
  notasCliente: z.string().optional(),
});

// POST /api/doctor/orders/[orderId]/pruebas/[pruebaId]/respond
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; pruebaId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== Role.DOCTOR) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { orderId, pruebaId } = await params;

    // Verify order belongs to this doctor
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, doctorId: true, orderNumber: true, patientName: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (order.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verify prueba exists, belongs to the order, and is still pending
    const prueba = await prisma.pruebaRecord.findUnique({
      where: { id: pruebaId },
    });

    if (!prueba || prueba.orderId !== orderId) {
      return NextResponse.json({ error: 'Prueba no encontrada' }, { status: 404 });
    }

    if (prueba.completada) {
      return NextResponse.json(
        { error: 'Esta prueba ya fue evaluada anteriormente' },
        { status: 400 }
      );
    }

    const body = await request.json();
    let validatedData;

    try {
      validatedData = respondSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: err.issues },
          { status: 400 }
        );
      }
      throw err;
    }

    // Require notes when rejecting
    if (!validatedData.aprobada && !validatedData.notasCliente?.trim()) {
      return NextResponse.json({ error: 'Debes indicar el motivo del rechazo' }, { status: 400 });
    }

    // Update prueba with doctor's response
    const updatedPrueba = await prisma.pruebaRecord.update({
      where: { id: pruebaId },
      data: {
        completada: true,
        aprobada: validatedData.aprobada,
        notasCliente: validatedData.notasCliente?.trim() ?? null,
        respondidaAt: new Date(),
        registradaAt: new Date(),
      },
    });

    // Get trial type label for alert message
    const TIPO_LABELS: Record<string, string> = {
      estructura: 'Estructura',
      biscocho: 'Biscocho',
      estetica: 'Estética',
      encerado: 'Encerado',
      oclusion: 'Oclusión',
      altura_dvo: 'Altura/DVO',
      color: 'Color',
      encaje: 'Encaje',
      rodetes: 'Rodetes',
      dientes: 'Dientes',
      provisional: 'Provisional',
      alineacion: 'Alineación',
      metal: 'Metal',
      implante: 'Implante',
    };

    const tipoLabel = TIPO_LABELS[prueba.tipo] ?? prueba.tipo;
    const doctorName = session.user.name ?? 'El doctor';
    const message = validatedData.aprobada
      ? `${doctorName} aprobó la prueba de ${tipoLabel} para el paciente ${order.patientName} (${order.orderNumber}).`
      : `${doctorName} rechazó la prueba de ${tipoLabel} para el paciente ${order.patientName} (${order.orderNumber}). Motivo: ${validatedData.notasCliente}`;

    // Send alert to all lab admins + emit SSE for real-time notification
    const labAdmins = await prisma.user.findMany({
      where: { role: Role.LAB_ADMIN },
      select: { id: true },
    });

    if (labAdmins.length > 0) {
      const sender = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, role: true },
      });

      for (const admin of labAdmins) {
        const alert = await prisma.alert.create({
          data: {
            message,
            orderId: order.id,
            senderId: session.user.id,
            receiverId: admin.id,
          },
          include: {
            order: { select: { id: true, orderNumber: true, patientName: true } },
          },
        });

        eventBus.emit('new-alert', {
          ...alert,
          createdAt: alert.createdAt.toISOString(),
          readAt: alert.readAt?.toISOString() ?? null,
          resolvedAt: alert.resolvedAt?.toISOString() ?? null,
          sender: { name: sender?.name ?? null, role: sender?.role ?? Role.DOCTOR },
        });
      }
    }

    return NextResponse.json({ prueba: updatedPrueba }, { status: 200 });
  } catch (error) {
    console.error('Error responding to prueba:', error);
    return NextResponse.json({ error: 'Error al registrar evaluación' }, { status: 500 });
  }
}
