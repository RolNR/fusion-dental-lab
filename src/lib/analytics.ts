import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface OrderAnalytics {
  totalOrders: number;
  aiGeneratedOrders: number;
  aiPercentage: number;
  averageTeethPerOrder: number;
  ordersByTipoCaso: Record<string, number>;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  doctorId?: string;
}

/**
 * Get order analytics from audit logs
 *
 * Queries the AuditLog table for order submissions (STATUS_CHANGE to PENDING_REVIEW)
 * and calculates AI usage statistics from the metadata field.
 *
 * @param filters - Optional filters for date range and doctor
 * @returns Order analytics including AI usage percentage
 */
export async function getOrderAnalytics(
  filters: AnalyticsFilters = {}
): Promise<OrderAnalytics> {
  const { startDate, endDate, doctorId } = filters;

  // Build where clause for audit logs
  const where: Prisma.AuditLogWhereInput = {
    action: 'STATUS_CHANGE',
    entityType: 'Order',
    newValue: 'PENDING_REVIEW',
    ...(startDate && { createdAt: { gte: startDate } }),
    ...(endDate && { createdAt: { lte: endDate } }),
    ...(doctorId && { userId: doctorId }),
  };

  // Get all order submission audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where,
    select: {
      metadata: true,
    },
  });

  // Calculate statistics
  let aiGeneratedCount = 0;
  let totalTeeth = 0;
  const tipoCasoCounts: Record<string, number> = {};

  for (const log of auditLogs) {
    const metadata = log.metadata as Record<string, unknown> | null;

    if (metadata) {
      // Count AI-generated orders
      if (metadata.aiGenerated === true) {
        aiGeneratedCount++;
      }

      // Sum teeth count
      if (typeof metadata.teethCount === 'number') {
        totalTeeth += metadata.teethCount;
      }

      // Count by tipoCaso
      if (typeof metadata.tipoCaso === 'string') {
        tipoCasoCounts[metadata.tipoCaso] = (tipoCasoCounts[metadata.tipoCaso] || 0) + 1;
      }
    }
  }

  const totalOrders = auditLogs.length;

  return {
    totalOrders,
    aiGeneratedOrders: aiGeneratedCount,
    aiPercentage: totalOrders > 0 ? Math.round((aiGeneratedCount / totalOrders) * 100) : 0,
    averageTeethPerOrder: totalOrders > 0 ? Math.round((totalTeeth / totalOrders) * 10) / 10 : 0,
    ordersByTipoCaso: tipoCasoCounts,
  };
}

/**
 * Get daily order statistics for a date range
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Array of daily statistics
 */
export async function getDailyOrderStats(
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; total: number; aiGenerated: number }>> {
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: 'STATUS_CHANGE',
      entityType: 'Order',
      newValue: 'PENDING_REVIEW',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      metadata: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group by date
  const dailyStats: Record<string, { total: number; aiGenerated: number }> = {};

  for (const log of auditLogs) {
    const dateKey = log.createdAt.toISOString().split('T')[0];

    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { total: 0, aiGenerated: 0 };
    }

    dailyStats[dateKey].total++;

    const metadata = log.metadata as Record<string, unknown> | null;
    if (metadata?.aiGenerated === true) {
      dailyStats[dateKey].aiGenerated++;
    }
  }

  // Convert to array
  return Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    ...stats,
  }));
}
