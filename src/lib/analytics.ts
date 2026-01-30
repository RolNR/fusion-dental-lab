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
export async function getOrderAnalytics(filters: AnalyticsFilters = {}): Promise<OrderAnalytics> {
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

export interface DoctorStats {
  doctorId: string;
  doctorName: string;
  totalOrders: number;
  aiOrders: number;
  aiPercentage: number;
}

/**
 * Get order statistics by doctor
 *
 * @param filters - Optional filters for date range
 * @param limit - Max number of doctors to return (default 10)
 * @returns Array of doctor statistics sorted by total orders
 */
export async function getDoctorStats(
  filters: AnalyticsFilters = {},
  limit: number = 10
): Promise<DoctorStats[]> {
  const { startDate, endDate } = filters;

  // Build where clause for orders
  const where: Prisma.OrderWhereInput = {
    status: { not: 'DRAFT' },
    submittedAt: { not: null },
    ...(startDate && { submittedAt: { gte: startDate } }),
    ...(endDate && { submittedAt: { lte: endDate } }),
  };

  // Get orders grouped by doctor
  const orders = await prisma.order.findMany({
    where,
    select: {
      doctorId: true,
      aiPrompt: true,
      doctor: {
        select: {
          name: true,
        },
      },
    },
  });

  // Aggregate by doctor
  const doctorMap: Record<string, { name: string; total: number; ai: number }> = {};

  for (const order of orders) {
    if (!doctorMap[order.doctorId]) {
      doctorMap[order.doctorId] = {
        name: order.doctor.name,
        total: 0,
        ai: 0,
      };
    }
    doctorMap[order.doctorId].total++;
    if (order.aiPrompt) {
      doctorMap[order.doctorId].ai++;
    }
  }

  // Convert to array and sort by total orders
  const stats: DoctorStats[] = Object.entries(doctorMap)
    .map(([doctorId, data]) => ({
      doctorId,
      doctorName: data.name,
      totalOrders: data.total,
      aiOrders: data.ai,
      aiPercentage: data.total > 0 ? Math.round((data.ai / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, limit);

  return stats;
}

export interface NeedsInfoStats {
  totalOrders: number;
  needsInfoOrders: number;
  needsInfoRate: number;
}

/**
 * Get NEEDS_INFO rate statistics
 *
 * Calculates how often orders require additional information
 *
 * @param filters - Optional filters for date range
 * @returns NEEDS_INFO rate statistics
 */
export async function getNeedsInfoStats(filters: AnalyticsFilters = {}): Promise<NeedsInfoStats> {
  const { startDate, endDate } = filters;

  // Count orders that have ever been in NEEDS_INFO status
  // We track this via audit logs with STATUS_CHANGE to NEEDS_INFO
  const needsInfoLogs = await prisma.auditLog.count({
    where: {
      action: 'STATUS_CHANGE',
      entityType: 'Order',
      newValue: 'NEEDS_INFO',
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    },
  });

  // Count total submitted orders in the same period
  const totalSubmitted = await prisma.auditLog.count({
    where: {
      action: 'STATUS_CHANGE',
      entityType: 'Order',
      newValue: 'PENDING_REVIEW',
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    },
  });

  return {
    totalOrders: totalSubmitted,
    needsInfoOrders: needsInfoLogs,
    needsInfoRate: totalSubmitted > 0 ? Math.round((needsInfoLogs / totalSubmitted) * 100) : 0,
  };
}

export interface UrgentOrderStats {
  date: string;
  totalOrders: number;
  urgentOrders: number;
  urgentPercentage: number;
}

/**
 * Get urgent orders statistics over time
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Array of daily urgent order statistics
 */
export async function getUrgentOrderStats(
  startDate: Date,
  endDate: Date
): Promise<UrgentOrderStats[]> {
  // Get submitted orders with urgent flag
  const orders = await prisma.order.findMany({
    where: {
      submittedAt: {
        gte: startDate,
        lte: endDate,
      },
      status: { not: 'DRAFT' },
    },
    select: {
      submittedAt: true,
      isUrgent: true,
    },
  });

  // Group by date
  const dailyStats: Record<string, { total: number; urgent: number }> = {};

  for (const order of orders) {
    if (!order.submittedAt) continue;

    const dateKey = order.submittedAt.toISOString().split('T')[0];

    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { total: 0, urgent: 0 };
    }

    dailyStats[dateKey].total++;
    if (order.isUrgent) {
      dailyStats[dateKey].urgent++;
    }
  }

  // Convert to array sorted by date
  return Object.entries(dailyStats)
    .map(([date, stats]) => ({
      date,
      totalOrders: stats.total,
      urgentOrders: stats.urgent,
      urgentPercentage: stats.total > 0 ? Math.round((stats.urgent / stats.total) * 100) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
