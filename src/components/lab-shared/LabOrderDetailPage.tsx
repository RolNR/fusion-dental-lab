'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Role } from '@prisma/client';
import { OrderDetail } from '@/types/order';
import { getStatusLabel, getStatusColor } from '@/lib/orderStatusUtils';
import { getScanTypeLabel } from '@/lib/scanTypeUtils';
import { formatFileSize, formatDate } from '@/lib/formatters';
import { StatusChangeControl } from '@/components/orders/StatusChangeControl';
import { CopyableField } from '@/components/ui/CopyableField';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { FileList } from '@/components/orders/FileList';
import { useSession } from 'next-auth/react';

interface CopyButtonProps {
  value: string;
  label: string;
}

function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      title={`Copiar ${label}`}
      className="ml-2 p-1 h-auto min-h-0"
    >
      {copied ? <Icons.check size={16} /> : <Icons.copy size={16} />}
    </Button>
  );
}

interface LabOrderDetailPageProps {
  role: 'lab-admin' | 'lab-collaborator';
}

export function LabOrderDetailPage({ role }: LabOrderDetailPageProps) {
  const params = useParams();
  const orderId = params.orderId as string;
  const { data: session } = useSession();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiEndpoint = `/api/${role}/orders/${orderId}`;
  const backUrl = `/${role}/orders`;

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error('Error al cargar orden');
      }
      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error || 'Orden no encontrada'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link href={backUrl} className="text-sm text-primary hover:text-primary/80">
            ← Volver a Órdenes
          </Link>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
              Orden {order.orderNumber}
              <CopyButton value={order.orderNumber} label="número de orden" />
            </h1>
            <p className="mt-2 text-muted-foreground break-words">
              Paciente: {order.patientName}
              <CopyButton value={order.patientName} label="nombre del paciente" />
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold self-start ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient & Order Info */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Información de la Orden</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CopyableField label="Nombre del Paciente" value={order.patientName} />
              <CopyableField label="ID del Paciente" value={order.patientId} />
              <CopyableField label="Fecha de Creación" value={formatDate(order.createdAt, true)} />
              <CopyableField
                label="Última Actualización"
                value={formatDate(order.updatedAt, true)}
              />
            </dl>
          </div>

          {/* Dental Details */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Detalles Dentales</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CopyableField label="Números de Dientes" value={order.teethNumbers} />
              <CopyableField label="Material" value={order.material} />
              <CopyableField label="Marca del Material" value={order.materialBrand} />
              <CopyableField label="Color" value={order.color} />
              <CopyableField
                label="Tipo de Escaneo"
                value={order.scanType ? getScanTypeLabel(order.scanType) : null}
              />
            </dl>
            {order.description && (
              <div className="mt-4">
                <CopyableField label="Descripción" value={order.description} />
              </div>
            )}
            {order.notes && (
              <div className="mt-4">
                <CopyableField label="Notas" value={order.notes} />
              </div>
            )}
          </div>

          {/* Files */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Archivos</h2>
            <FileList orderId={order.id} canDelete={false} />
          </div>
        </div>

        {/* Right Column - Clinic & Doctor Info */}
        <div className="space-y-6">
          {/* Status Change Control */}
          {session?.user?.role && (
            <StatusChangeControl
              orderId={order.id}
              currentStatus={order.status}
              userRole={session.user.role as Role}
              onStatusChange={fetchOrder}
            />
          )}

          {/* Clinic Info */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Clínica</h2>
            <dl className="space-y-3">
              <CopyableField label="Nombre" value={order.clinic.name} />
              <CopyableField label="Email" value={order.clinic.email} />
              <CopyableField label="Teléfono" value={order.clinic.phone} />
              <CopyableField label="Dirección" value={order.clinic.address} />
            </dl>
          </div>

          {/* Doctor Info */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Doctor</h2>
            <dl className="space-y-3">
              <CopyableField label="Nombre" value={order.doctor.name} />
              <CopyableField label="Email" value={order.doctor.email} />
            </dl>
          </div>

          {/* Created By Info */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Creado Por</h2>
            <dl className="space-y-3">
              <CopyableField label="Nombre" value={order.createdBy.name} />
              <CopyableField label="Email" value={order.createdBy.email} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
