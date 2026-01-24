import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

interface DeleteAlertParams {
  alertId: string;
  userId: string;
  userRole: typeof Role.DOCTOR;
}

interface DeleteAlertResult {
  success: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Shared logic for deleting alerts
 *
 * Validates:
 * - Alert exists
 * - User owns the alert
 * - Alert is not UNREAD (only READ or RESOLVED can be deleted)
 *
 * @param params - Delete parameters
 * @returns Result with success flag and optional error
 */
export async function deleteAlert({
  alertId,
  userId,
  userRole,
}: DeleteAlertParams): Promise<DeleteAlertResult> {
  // Check if alert exists
  const existingAlert = await prisma.alert.findUnique({
    where: { id: alertId },
  });

  if (!existingAlert) {
    return {
      success: false,
      error: 'Alerta no encontrada',
      statusCode: 404,
    };
  }

  // Verify ownership
  if (existingAlert.receiverId !== userId) {
    return {
      success: false,
      error: 'No autorizado para eliminar esta alerta',
      statusCode: 403,
    };
  }

  // Only allow deletion of READ or RESOLVED alerts (not UNREAD)
  if (existingAlert.status === 'UNREAD') {
    return {
      success: false,
      error: 'No se pueden eliminar alertas no leídas',
      statusCode: 400,
    };
  }

  // Delete the alert
  await prisma.alert.delete({
    where: { id: alertId },
  });

  return {
    success: true,
  };
}
