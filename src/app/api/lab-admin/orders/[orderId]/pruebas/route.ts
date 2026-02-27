import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, TrialType } from '@prisma/client';
import { z } from 'zod';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';
import eventBus from '@/lib/sse/eventBus';

const pruebaCreateSchema = z.object({
  tipo: z.nativeEnum(TrialType),
  nota: z.string().optional(),
  completada: z.boolean().default(false),
});

// GET /api/lab-admin/orders/[orderId]/pruebas
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== Role.LAB_ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { orderId } = await params;

    const accessCheck = await checkOrderAccess({
      orderId,
      userId: session.user.id,
      userRole: session.user.role as Role,
      laboratoryId: session.user.laboratoryId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.statusCode });
    }

    const pruebas = await prisma.pruebaRecord.findMany({
      where: { orderId },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ pruebas }, { status: 200 });
  } catch (error) {
    console.error('Error fetching pruebas:', error);
    return NextResponse.json({ error: 'Error al obtener historial de pruebas' }, { status: 500 });
  }
}

// POST /api/lab-admin/orders/[orderId]/pruebas
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== Role.LAB_ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { orderId } = await params;

    const accessCheck = await checkOrderAccess({
      orderId,
      userId: session.user.id,
      userRole: session.user.role as Role,
      laboratoryId: session.user.laboratoryId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.statusCode });
    }

    const body = await request.json();
    let validatedData;

    try {
      validatedData = pruebaCreateSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: err.issues },
          { status: 400 }
        );
      }
      throw err;
    }

    const prueba = await prisma.pruebaRecord.create({
      data: {
        orderId,
        tipo: validatedData.tipo,
        nota: validatedData.nota ?? null,
        completada: validatedData.completada,
        registradaAt: validatedData.completada ? new Date() : null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // When registering a pending trial, notify the doctor
    if (!validatedData.completada) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          patientName: true,
          doctorId: true,
        },
      });

      if (order?.doctorId) {
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
        const tipoLabel = TIPO_LABELS[validatedData.tipo] ?? validatedData.tipo;
        const message = `El laboratorio envió el caso de ${order.patientName} (${order.orderNumber}) para prueba de ${tipoLabel}. Por favor evalúa la prueba una vez recibida.`;

        const alert = await prisma.alert.create({
          data: {
            message,
            orderId: order.id,
            senderId: session.user.id,
            receiverId: order.doctorId,
          },
          include: {
            order: { select: { id: true, orderNumber: true, patientName: true } },
            sender: { select: { name: true, role: true } },
          },
        });

        eventBus.emit('new-alert', {
          ...alert,
          createdAt: alert.createdAt.toISOString(),
          readAt: alert.readAt?.toISOString() ?? null,
          resolvedAt: alert.resolvedAt?.toISOString() ?? null,
          sender: { name: alert.sender.name, role: alert.sender.role },
        });
      }
    }

    return NextResponse.json({ prueba }, { status: 201 });
  } catch (error) {
    console.error('Error creating prueba:', error);
    return NextResponse.json({ error: 'Error al registrar prueba' }, { status: 500 });
  }
}
