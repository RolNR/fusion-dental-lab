import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import {
  getOrderAnalytics,
  getDailyOrderStats,
  getDoctorStats,
  getNeedsInfoStats,
  getUrgentOrderStats,
} from '@/lib/analytics';

/**
 * GET /api/lab-admin/analytics
 *
 * Returns order analytics including AI usage statistics
 *
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - daily: 'true' to include daily breakdown (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== Role.LAB_ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const includeDaily = searchParams.get('daily') === 'true';

    // Default to last 30 days if no dates provided
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all analytics in parallel
    const [analytics, doctorStats, needsInfoStats, urgentStats] = await Promise.all([
      getOrderAnalytics({ startDate, endDate }),
      getDoctorStats({ startDate, endDate }, 10),
      getNeedsInfoStats({ startDate, endDate }),
      getUrgentOrderStats(startDate, endDate),
    ]);

    return NextResponse.json({
      analytics,
      doctorStats,
      needsInfoStats,
      urgentStats,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Error al obtener analíticas' }, { status: 500 });
  }
}
