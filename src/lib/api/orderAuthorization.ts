import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface OrderAccessResult {
  hasAccess: boolean;
  error?: string;
  statusCode?: number;
  order?: any;
}

interface CheckOrderAccessParams {
  orderId: string;
  userId: string;
  userRole: Role;
  laboratoryId?: string | null;
  clinicId?: string | null;
}

/**
 * Checks if a user has access to view/modify an order
 *
 * Access rules:
 * - Lab users: Can access orders from clinics in their laboratory
 * - Doctors: Can access their own orders
 * - Clinic assistants/admins: Can access orders from their clinic
 *
 * @param params - Access check parameters
 * @returns Result with hasAccess flag, error message, and order data
 *
 * @example
 * const result = await checkOrderAccess({
 *   orderId: '123',
 *   userId: 'user-id',
 *   userRole: Role.DOCTOR,
 *   clinicId: 'clinic-id',
 * });
 *
 * if (!result.hasAccess) {
 *   return NextResponse.json({ error: result.error }, { status: result.statusCode });
 * }
 */
export async function checkOrderAccess({
  orderId,
  userId,
  userRole,
  laboratoryId,
  clinicId,
}: CheckOrderAccessParams): Promise<OrderAccessResult> {
  // Fetch order with clinic relationship
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      clinic: true,
    },
  });

  if (!order) {
    return {
      hasAccess: false,
      error: 'Orden no encontrada',
      statusCode: 404,
    };
  }

  // Determine user type and check access
  const isLabUser = userRole === Role.LAB_ADMIN || userRole === Role.LAB_COLLABORATOR;
  const isClinicUser =
    userRole === Role.DOCTOR ||
    userRole === Role.CLINIC_ASSISTANT ||
    userRole === Role.CLINIC_ADMIN;

  if (isLabUser) {
    // Lab users can only access orders from clinics in their laboratory
    if (order.clinic.laboratoryId !== laboratoryId) {
      return {
        hasAccess: false,
        error: 'No tienes acceso a esta orden',
        statusCode: 403,
      };
    }
  } else if (isClinicUser) {
    // Doctors can only access their own orders
    if (userRole === Role.DOCTOR && order.doctorId !== userId) {
      return {
        hasAccess: false,
        error: 'No tienes acceso a esta orden',
        statusCode: 403,
      };
    }

    // Clinic assistants and admins can access orders from their clinic
    if (
      (userRole === Role.CLINIC_ASSISTANT || userRole === Role.CLINIC_ADMIN) &&
      order.clinicId !== clinicId
    ) {
      return {
        hasAccess: false,
        error: 'No tienes acceso a esta orden',
        statusCode: 403,
      };
    }
  } else {
    return {
      hasAccess: false,
      error: 'No tienes permisos para acceder a esta orden',
      statusCode: 403,
    };
  }

  return {
    hasAccess: true,
    order,
  };
}
