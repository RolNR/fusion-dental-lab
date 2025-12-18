import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const orderSchema = z.object({
  doctorId: z.string().min(1, 'El doctor es requerido'),
  patientName: z.string().min(1, 'El nombre del paciente es requerido'),
  patientId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  teethNumbers: z.string().optional(),
  material: z.string().optional(),
  materialBrand: z.string().optional(),
  color: z.string().optional(),
  scanType: z.enum(['DIGITAL', 'PHYSICAL', 'NONE']).optional(),
});

// GET /api/assistant/orders - Get orders for doctors assigned to this assistant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get doctors assigned to this assistant
    const assignments = await prisma.doctorAssistant.findMany({
      where: {
        assistantId: session.user.id,
      },
      select: {
        doctorId: true,
      },
    });

    const doctorIds = assignments.map(a => a.doctorId);

    const orders = await prisma.order.findMany({
      where: {
        doctorId: {
          in: doctorIds,
        },
      },
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
        doctor: {
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
    console.error('Error fetching assistant orders:', error);
    return NextResponse.json(
      { error: 'Error al cargar órdenes' },
      { status: 500 }
    );
  }
}

// POST /api/assistant/orders - Create a new order on behalf of a doctor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLINIC_ASSISTANT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = orderSchema.parse(body);

    // Verify assistant is assigned to this doctor
    const assignment = await prisma.doctorAssistant.findUnique({
      where: {
        doctorId_assistantId: {
          doctorId: validatedData.doctorId,
          assistantId: session.user.id,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear órdenes para este doctor' },
        { status: 403 }
      );
    }

    // Get doctor's clinic
    const doctor = await prisma.user.findUnique({
      where: { id: validatedData.doctorId },
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
        patientName: validatedData.patientName,
        patientId: validatedData.patientId,
        description: validatedData.description,
        notes: validatedData.notes,
        teethNumbers: validatedData.teethNumbers,
        material: validatedData.material,
        materialBrand: validatedData.materialBrand,
        color: validatedData.color,
        scanType: validatedData.scanType,
        clinicId: doctor.doctorClinicId,
        doctorId: validatedData.doctorId,
        createdById: session.user.id,
        status: 'DRAFT',
      },
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
        doctor: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Error al crear orden' },
      { status: 500 }
    );
  }
}
