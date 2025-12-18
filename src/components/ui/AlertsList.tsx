'use client';

import Link from 'next/link';
import { AlertStatus } from '@prisma/client';

interface Alert {
  id: string;
  message: string;
  status: AlertStatus;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    patientName: string;
  };
  sender: {
    name: string;
    role: string;
  };
}

interface AlertsListProps {
  alerts: Alert[];
  baseUrl?: string;
  onMarkAsRead?: (alertId: string) => void;
  loading?: boolean;
}

const getStatusColor = (status: AlertStatus) => {
  const colors: Record<AlertStatus, string> = {
    UNREAD: 'bg-warning/10 border-warning/20 text-warning',
    READ: 'bg-muted border-border text-muted-foreground',
    RESOLVED: 'bg-success/10 border-success/20 text-success',
  };
  return colors[status];
};

const getStatusLabel = (status: AlertStatus) => {
  const labels: Record<AlertStatus, string> = {
    UNREAD: 'No leída',
    READ: 'Leída',
    RESOLVED: 'Resuelta',
  };
  return labels[status];
};

export function AlertsList({ alerts, baseUrl = '/doctor/orders', onMarkAsRead, loading }: AlertsListProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Alertas</h2>
        <div className="text-center text-muted-foreground py-8">Cargando alertas...</div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Alertas</h2>
        <div className="text-center text-muted-foreground py-8">
          No tienes alertas pendientes
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-background p-6 shadow-md border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Alertas</h2>
        {alerts.filter(a => a.status === 'UNREAD').length > 0 && (
          <span className="rounded-full bg-warning px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
            {alerts.filter(a => a.status === 'UNREAD').length} nuevas
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-sm ${getStatusColor(alert.status)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <Link
                href={`${baseUrl}/${alert.order.id}`}
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                Orden #{alert.order.orderNumber}
              </Link>
              <span className="text-xs font-medium">
                {getStatusLabel(alert.status)}
              </span>
            </div>

            <p className="text-sm text-foreground mb-2">{alert.message}</p>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Paciente: {alert.order.patientName}</span>
              <span>
                {new Date(alert.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            {alert.status === 'UNREAD' && onMarkAsRead && (
              <button
                onClick={() => onMarkAsRead(alert.id)}
                className="mt-3 w-full rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Marcar como leída
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
