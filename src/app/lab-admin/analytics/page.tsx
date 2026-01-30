'use client';

import { useEffect, useState } from 'react';
import { PieChart } from '@/components/ui/PieChart';
import { HorizontalBarChart } from '@/components/ui/HorizontalBarChart';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface Analytics {
  totalOrders: number;
  aiGeneratedOrders: number;
  aiPercentage: number;
  averageTeethPerOrder: number;
  ordersByTipoCaso: Record<string, number>;
}

interface DoctorStats {
  doctorId: string;
  doctorName: string;
  totalOrders: number;
  aiOrders: number;
  aiPercentage: number;
}

interface NeedsInfoStats {
  totalOrders: number;
  needsInfoOrders: number;
  needsInfoRate: number;
}

interface UrgentOrderStats {
  date: string;
  totalOrders: number;
  urgentOrders: number;
  urgentPercentage: number;
}

interface AnalyticsResponse {
  analytics: Analytics;
  doctorStats: DoctorStats[];
  needsInfoStats: NeedsInfoStats;
  urgentStats: UrgentOrderStats[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const CASE_TYPE_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  garantia: 'Garantía',
  regreso_prueba: 'Regreso de prueba',
  reparacion_ajuste: 'Reparación/Ajuste',
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      setError(null);

      try {
        const endDate = new Date();
        let startDate: Date | undefined;

        switch (dateRange) {
          case '7d':
            startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'all':
            startDate = undefined;
            break;
        }

        const params = new URLSearchParams();
        if (startDate) {
          params.append('startDate', startDate.toISOString());
        }
        params.append('endDate', endDate.toISOString());

        const response = await fetch(`/api/lab-admin/analytics?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Error al cargar analíticas');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">Error: {error}</div>
      </div>
    );
  }

  const aiOrders = analytics?.analytics.aiGeneratedOrders || 0;
  const manualOrders = (analytics?.analytics.totalOrders || 0) - aiOrders;

  // Calculate overall urgent percentage
  const totalUrgent = analytics?.urgentStats.reduce((sum, s) => sum + s.urgentOrders, 0) || 0;
  const totalFromUrgentStats = analytics?.urgentStats.reduce((sum, s) => sum + s.totalOrders, 0) || 0;
  const overallUrgentPercentage =
    totalFromUrgentStats > 0 ? Math.round((totalUrgent / totalFromUrgentStats) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analíticas</h1>
        <p className="mt-2 text-muted-foreground">Estadísticas de uso del sistema</p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-8 flex gap-2">
        <Button
          variant={dateRange === '7d' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setDateRange('7d')}
        >
          7 días
        </Button>
        <Button
          variant={dateRange === '30d' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setDateRange('30d')}
        >
          30 días
        </Button>
        <Button
          variant={dateRange === '90d' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setDateRange('90d')}
        >
          90 días
        </Button>
        <Button
          variant={dateRange === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setDateRange('all')}
        >
          Todo
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Total de órdenes</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {analytics?.analytics.totalOrders || 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Órdenes con IA</p>
          <p className="mt-2 text-3xl font-bold text-primary">{aiOrders}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {analytics?.analytics.aiPercentage || 0}%
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Tasa NEEDS_INFO</p>
          <p className="mt-2 text-3xl font-bold text-warning">
            {analytics?.needsInfoStats.needsInfoRate || 0}%
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {analytics?.needsInfoStats.needsInfoOrders || 0} órdenes
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Órdenes urgentes</p>
          <p className="mt-2 text-3xl font-bold text-danger">{overallUrgentPercentage}%</p>
          <p className="mt-1 text-sm text-muted-foreground">{totalUrgent} órdenes</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Promedio dientes</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {analytics?.analytics.averageTeethPerOrder || 0}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">por orden</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        {/* AI Usage Pie Chart */}
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Uso de IA</h2>
          <div className="flex justify-center">
            <PieChart
              segments={[
                { value: aiOrders, color: 'hsl(var(--primary))', label: 'Con IA' },
                { value: manualOrders, color: 'hsl(var(--muted))', label: 'Manual' },
              ]}
              size={220}
            />
          </div>
        </div>

        {/* Top Doctors by Volume */}
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Top doctores por volumen</h2>
          <HorizontalBarChart
            items={(analytics?.doctorStats || []).map((doc) => ({
              label: doc.doctorName,
              value: doc.totalOrders,
            }))}
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        {/* AI Usage by Doctor */}
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Uso de IA por doctor</h2>
          <HorizontalBarChart
            items={(analytics?.doctorStats || [])
              .filter((doc) => doc.totalOrders > 0)
              .sort((a, b) => b.aiPercentage - a.aiPercentage)
              .map((doc) => ({
                label: doc.doctorName,
                value: doc.aiOrders,
                secondaryValue: doc.aiPercentage,
              }))}
            showPercentage={true}
            secondaryLabel="IA"
          />
        </div>

        {/* Case Type Distribution */}
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Tipos de caso</h2>
          {analytics?.analytics.ordersByTipoCaso &&
          Object.keys(analytics.analytics.ordersByTipoCaso).length > 0 ? (
            <HorizontalBarChart
              items={Object.entries(analytics.analytics.ordersByTipoCaso).map(([tipo, count]) => ({
                label: CASE_TYPE_LABELS[tipo] || tipo,
                value: count,
              }))}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">Sin datos de tipos de caso</p>
          )}
        </div>
      </div>

      {/* Urgent Orders Over Time */}
      <div className="rounded-lg border border-border bg-background p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">
          Órdenes urgentes en el tiempo
        </h2>
        {analytics?.urgentStats && analytics.urgentStats.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-w-[600px]" style={{ height: '200px' }}>
              {analytics.urgentStats.map((stat, index) => {
                const maxTotal = Math.max(...analytics.urgentStats.map((s) => s.totalOrders), 1);
                const totalHeight = (stat.totalOrders / maxTotal) * 100;
                const urgentHeight = (stat.urgentOrders / maxTotal) * 100;
                const date = new Date(stat.date);
                const dateLabel = `${date.getDate()}/${date.getMonth() + 1}`;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center justify-end gap-1"
                    title={`${stat.date}: ${stat.urgentOrders}/${stat.totalOrders} urgentes (${stat.urgentPercentage}%)`}
                  >
                    <div className="relative w-full flex flex-col items-center">
                      {/* Total orders bar */}
                      <div
                        className="w-full max-w-[30px] bg-muted rounded-t relative"
                        style={{ height: `${totalHeight}%`, minHeight: stat.totalOrders > 0 ? '4px' : '0' }}
                      >
                        {/* Urgent orders overlay */}
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-danger rounded-t"
                          style={{ height: `${(stat.urgentOrders / stat.totalOrders) * 100 || 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground rotate-0">{dateLabel}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-muted" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-danger" />
                <span className="text-sm text-muted-foreground">Urgentes</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Sin datos de órdenes urgentes</p>
        )}
      </div>
    </div>
  );
}
