import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CaseType, OrderStatus, Role } from '@prisma/client';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';
import { updateOrderStatus } from '@/lib/api/orderStatusUpdate';
import { prisma } from '@/lib/prisma';
import {
  orderSubmitSchema,
  orderSubmitWarrantySchema,
  orderSubmitRepairSchema,
} from '@/types/order';

/**
 * Factory function to create a submit order handler with role-based permissions
 *
 * @param allowedRoles - Array of roles that can submit orders via this endpoint
 * @returns POST handler function for submitting orders
 */
export function createSubmitOrderHandler(allowedRoles: Role[]) {
  return async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      // Check if user's role is allowed to submit
      if (!allowedRoles.includes(session.user.role as Role)) {
        return NextResponse.json(
          { error: 'No tienes permisos para realizar esta acción' },
          { status: 403 }
        );
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

      // Fetch order with teeth data for validation
      const orderData = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          teeth: {
            select: {
              toothNumber: true,
              material: true,
              colorInfo: true,
              tipoRestauracion: true,
              trabajoSobreImplante: true,
              informacionImplante: true,
            },
          },
        },
      });

      if (!orderData) {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
      }

      // Select validation schema based on case type
      const tipoCaso = orderData.tipoCaso;
      const dataToValidate = {
        patientName: orderData.patientName,
        teeth: orderData.teeth,
        tipoCaso: orderData.tipoCaso,
        motivoGarantia: orderData.motivoGarantia,
      };

      // Validate order data before submitting
      try {
        if (tipoCaso === CaseType.garantia) {
          // Warranty cases: require motivoGarantia, teeth optional
          orderSubmitWarrantySchema.parse(dataToValidate);
        } else if (
          tipoCaso === CaseType.reparacion_ajuste ||
          tipoCaso === CaseType.regreso_prueba
        ) {
          // Repair/adjustment cases: teeth optional
          orderSubmitRepairSchema.parse(dataToValidate);
        } else {
          // New cases (nuevo) or no case type: require teeth
          orderSubmitSchema.parse(dataToValidate);
        }
      } catch (validationError) {
        // Return validation errors to client
        if (validationError instanceof Error && 'issues' in validationError) {
          return NextResponse.json(
            {
              error: 'Validación fallida',
              details: (validationError as { issues: Array<{ path: string[]; message: string }> })
                .issues,
            },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: 'Error de validación' }, { status: 400 });
      }

      // Update order status to PENDING_REVIEW with AI analytics metadata
      const updateResult = await updateOrderStatus({
        orderId,
        newStatus: OrderStatus.PENDING_REVIEW,
        userId,
        userRole,
        metadata: {
          aiGenerated: Boolean(orderData.aiPrompt),
          aiPromptLength: orderData.aiPrompt?.length || 0,
          teethCount: orderData.teeth.length,
          tipoCaso: orderData.tipoCaso,
        },
      });

      if (!updateResult.success) {
        return NextResponse.json(
          { error: updateResult.error },
          { status: updateResult.statusCode }
        );
      }

      return NextResponse.json(updateResult.order);
    } catch (error) {
      console.error('Error submitting order:', error);
      return NextResponse.json({ error: 'Error al enviar la orden' }, { status: 500 });
    }
  };
}
