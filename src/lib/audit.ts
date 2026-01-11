import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

interface AuditLogParams {
  action: AuditAction;
  userId: string;
  entityType: string;
  entityId: string;
  oldValue?: string | Record<string, any>;
  newValue?: string | Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  orderId?: string;
  fileId?: string;
  alertId?: string;
}

/**
 * Create an audit log entry
 *
 * This function is fault-tolerant - it will log errors but not throw them
 * to prevent audit logging failures from breaking the main application flow.
 *
 * @param params - Audit log parameters
 * @returns The created audit log entry, or null if creation failed
 */
export async function createAuditLog(params: AuditLogParams) {
  try {
    const {
      action,
      userId,
      entityType,
      entityId,
      oldValue,
      newValue,
      metadata,
      ipAddress,
      userAgent,
      orderId,
      fileId,
      alertId,
    } = params;

    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        oldValue: oldValue
          ? typeof oldValue === 'string'
            ? oldValue
            : JSON.stringify(oldValue)
          : undefined,
        newValue: newValue
          ? typeof newValue === 'string'
            ? newValue
            : JSON.stringify(newValue)
          : undefined,
        metadata: metadata || undefined,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        orderId: orderId || undefined,
        fileId: fileId || undefined,
        alertId: alertId || undefined,
      },
    });

    return auditLog;
  } catch (error) {
    // Log the error but don't throw - audit logging should never break the app
    console.error('Failed to create audit log:', error);
    console.error('Audit log params:', params);
    return null;
  }
}

/**
 * Log authentication-related events
 *
 * Convenience wrapper for logging auth events (LOGIN, LOGOUT, REGISTER, etc.)
 *
 * @param action - The authentication action
 * @param userId - The user ID performing the action
 * @param email - The user's email
 * @param additionalData - Additional metadata to include
 */
export async function logAuthEvent(
  action: Extract<AuditAction, 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'USER_APPROVED' | 'USER_REJECTED'>,
  userId: string,
  email: string,
  additionalData?: {
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any>;
  }
) {
  return createAuditLog({
    action,
    userId,
    entityType: 'User',
    entityId: userId,
    metadata: {
      email,
      timestamp: new Date().toISOString(),
      ...additionalData?.metadata,
    },
    ipAddress: additionalData?.ipAddress,
    userAgent: additionalData?.userAgent,
  });
}

/**
 * Log order-related events
 *
 * Convenience wrapper for logging order events (CREATE, UPDATE, STATUS_CHANGE, etc.)
 *
 * @param action - The order action
 * @param userId - The user ID performing the action
 * @param orderId - The order ID
 * @param oldValue - Previous state (for updates)
 * @param newValue - New state
 * @param additionalData - Additional metadata
 */
export async function logOrderEvent(
  action: AuditAction,
  userId: string,
  orderId: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>,
  additionalData?: {
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any>;
  }
) {
  return createAuditLog({
    action,
    userId,
    entityType: 'Order',
    entityId: orderId,
    orderId,
    oldValue,
    newValue,
    metadata: additionalData?.metadata,
    ipAddress: additionalData?.ipAddress,
    userAgent: additionalData?.userAgent,
  });
}

/**
 * Log file-related events
 *
 * Convenience wrapper for logging file events (FILE_UPLOAD, FILE_DOWNLOAD, FILE_DELETE)
 *
 * @param action - The file action
 * @param userId - The user ID performing the action
 * @param fileId - The file ID
 * @param orderId - The associated order ID
 * @param metadata - Additional file metadata
 * @param additionalData - Additional data like IP and user agent
 */
export async function logFileEvent(
  action: Extract<AuditAction, 'FILE_UPLOAD' | 'FILE_DOWNLOAD' | 'FILE_DELETE'>,
  userId: string,
  fileId: string,
  orderId: string,
  metadata?: Record<string, any>,
  additionalData?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  }
) {
  return createAuditLog({
    action,
    userId,
    entityType: 'File',
    entityId: fileId,
    fileId,
    orderId,
    metadata,
    ipAddress: additionalData?.ipAddress,
    userAgent: additionalData?.userAgent,
  });
}

/**
 * Log alert-related events
 *
 * Convenience wrapper for logging alert events (ALERT_SENT, ALERT_READ)
 *
 * @param action - The alert action
 * @param userId - The user ID performing the action
 * @param alertId - The alert ID
 * @param orderId - The associated order ID
 * @param metadata - Additional alert metadata
 * @param additionalData - Additional data like IP and user agent
 */
export async function logAlertEvent(
  action: Extract<AuditAction, 'ALERT_SENT' | 'ALERT_READ'>,
  userId: string,
  alertId: string,
  orderId: string,
  metadata?: Record<string, any>,
  additionalData?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  }
) {
  return createAuditLog({
    action,
    userId,
    entityType: 'Alert',
    entityId: alertId,
    alertId,
    orderId,
    metadata,
    ipAddress: additionalData?.ipAddress,
    userAgent: additionalData?.userAgent,
  });
}

/**
 * Helper to extract IP address from Next.js request headers
 *
 * @param headers - Request headers
 * @returns IP address or null
 */
export function getIpAddress(headers: Headers): string | null {
  return headers.get('x-forwarded-for') || headers.get('x-real-ip') || null;
}

/**
 * Helper to extract user agent from Next.js request headers
 *
 * @param headers - Request headers
 * @returns User agent string or null
 */
export function getUserAgent(headers: Headers): string | null {
  return headers.get('user-agent') || null;
}

/**
 * Helper to get audit context from Next.js request
 *
 * Extracts IP address and user agent for audit logging
 *
 * @param request - Next.js request object
 * @returns Object with ipAddress and userAgent
 */
export function getAuditContext(request: { headers: Headers }) {
  return {
    ipAddress: getIpAddress(request.headers),
    userAgent: getUserAgent(request.headers),
  };
}
