'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { OrderStatus, ScanType } from '@prisma/client';

type OrderDetail = {
  id: string;
  orderNumber: string;
  patientName: string;
  patientId: string | null;
  description: string | null;
  notes: string | null;
  teethNumbers: string | null;
  material: string | null;
  materialBrand: string | null;
  color: string | null;
  scanType: ScanType | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  materialsSentAt: string | null;
  completedAt: string | null;
  clinic: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  doctor: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  files: Array<{
    id: string;
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    storageUrl: string;
    createdAt: string;
  }>;
};

const getStatusLabel = (status: OrderStatus) => {
  const labels: Record<OrderStatus, string> = {
    DRAFT: 'Borrador',
    MATERIALS_SENT: 'Materiales Enviados',
    NEEDS_INFO: 'Necesita Información',
    IN_PROGRESS: 'En Proceso',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
  };
  return labels[status];
};

const getStatusColor = (status: OrderStatus) => {
  const colors: Record<OrderStatus, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    MATERIALS_SENT: 'bg-primary/10 text-primary',
    NEEDS_INFO: 'bg-warning/10 text-warning',
    IN_PROGRESS: 'bg-info/10 text-info',
    COMPLETED: 'bg-success/10 text-success',
    CANCELLED: 'bg-danger/10 text-danger',
  };
  return colors[status];
};

const getScanTypeLabel = (scanType: ScanType | null) => {
  if (!scanType) return '-';
  const labels: Record<ScanType, string> = {
    DIGITAL_SCAN: 'Escaneo Digital',
    ANALOG_MOLD: 'Molde Análogo',
  };
  return labels[scanType];
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/lab-admin/orders/${orderId}`);
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
    }

    fetchOrder();
  }, [orderId]);

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
          <Link
            href="/lab-admin/orders"
            className="text-sm text-primary hover:text-primary/80"
          >
            ← Volver a Órdenes
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Orden {order.orderNumber}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Paciente: {order.patientName}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
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
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Información de la Orden
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Nombre del Paciente
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.patientName}
                </dd>
              </div>
              {order.patientId && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    ID del Paciente
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {order.patientId}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Fecha de Creación
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {new Date(order.createdAt).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Última Actualización
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {new Date(order.updatedAt).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Dental Details */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Detalles Dentales
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Números de Dientes
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.teethNumbers || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Material
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.material || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Marca del Material
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.materialBrand || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Color
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.color || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Tipo de Escaneo
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {getScanTypeLabel(order.scanType)}
                </dd>
              </div>
            </dl>
            {order.description && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-muted-foreground">
                  Descripción
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.description}
                </dd>
              </div>
            )}
            {order.notes && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-muted-foreground">
                  Notas
                </dt>
                <dd className="mt-1 text-sm text-foreground">{order.notes}</dd>
              </div>
            )}
          </div>

          {/* Files */}
          {order.files.length > 0 && (
            <div className="rounded-xl bg-background p-6 shadow-md border border-border">
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                Archivos
              </h2>
              <div className="space-y-3">
                {order.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.fileSize)} •{' '}
                        {new Date(file.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <a
                      href={file.storageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Descargar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Clinic & Doctor Info */}
        <div className="space-y-6">
          {/* Clinic Info */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Clínica
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Nombre
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.clinic.name}
                </dd>
              </div>
              {order.clinic.email && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {order.clinic.email}
                  </dd>
                </div>
              )}
              {order.clinic.phone && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Teléfono
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {order.clinic.phone}
                  </dd>
                </div>
              )}
              {order.clinic.address && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Dirección
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {order.clinic.address}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Doctor Info */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Doctor
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Nombre
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.doctor.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.doctor.email}
                </dd>
              </div>
            </dl>
          </div>

          {/* Created By Info */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Creado Por
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Nombre
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.createdBy.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.createdBy.email}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
