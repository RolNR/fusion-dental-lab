'use client';

import { useEffect, useState } from 'react';
import { PieChart } from '@/components/ui/PieChart';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface Analytics {
  totalOrders: number;
  aiGeneratedOrders: number;
  aiPercentage: number;
  averageTeethPerOrder: number;
  ordersByTipoCaso: Record<string, number>;
}

interface AnalyticsResponse {
  analytics: Analytics;
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
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Total de órdenes</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {analytics?.analytics.totalOrders || 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Órdenes con IA</p>
          <p className="mt-2 text-3xl font-bold text-primary">{aiOrders}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Porcentaje IA</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {analytics?.analytics.aiPercentage || 0}%
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-6">
          <p className="text-sm text-muted-foreground">Promedio dientes/orden</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {analytics?.analytics.averageTeethPerOrder || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
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

        {/* Case Type Distribution */}
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Tipos de caso</h2>
          {analytics?.analytics.ordersByTipoCaso &&
          Object.keys(analytics.analytics.ordersByTipoCaso).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(analytics.analytics.ordersByTipoCaso).map(([tipo, count]) => {
                const total = analytics.analytics.totalOrders || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={tipo}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground">
                        {CASE_TYPE_LABELS[tipo] || tipo}
                      </span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Sin datos de tipos de caso</p>
          )}
        </div>
      </div>
    </div>
  );
}
