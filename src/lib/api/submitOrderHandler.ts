import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderStatus, Role } from '@prisma/client';
import { checkOrderAccess } from '@/lib/api/orderAuthorization';
import { updateOrderStatus } from '@/lib/api/orderStatusUpdate';

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
        clinicId: session.user.clinicId,
      });

      if (!accessCheck.hasAccess) {
        return NextResponse.json(
          { error: accessCheck.error },
          { status: accessCheck.statusCode }
        );
      }

      // Update order status to PENDING_REVIEW
      const updateResult = await updateOrderStatus({
        orderId,
        newStatus: OrderStatus.PENDING_REVIEW,
        userId,
        userRole,
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
      return NextResponse.json(
        { error: 'Error al enviar la orden' },
        { status: 500 }
      );
    }
  };
}
