import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { orderCreateSchema } from '@/types/order';

// GET /api/doctor/orders - Get all orders for the logged-in doctor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        doctorId: session.user.id,
      },
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching doctor orders:', error);
    return NextResponse.json(
      { error: 'Error al cargar órdenes' },
      { status: 500 }
    );
  }
}

// POST /api/doctor/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = orderCreateSchema.parse(body);

    // Get doctor's clinic
    const doctor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { doctorClinicId: true },
    });

    if (!doctor?.doctorClinicId) {
      return NextResponse.json(
        { error: 'Doctor no asignado a una clínica' },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        ...validatedData,
        clinicId: doctor.doctorClinicId,
        doctorId: session.user.id,
        createdById: session.user.id,
        status: 'DRAFT',
      },
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: err.issues },
        { status: 400 }
      );
    }

    console.error('Error creating order:', err);
    return NextResponse.json(
      { error: 'Error al crear orden' },
      { status: 500 }
    );
  }
}
