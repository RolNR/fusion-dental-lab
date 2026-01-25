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
import { OcclusionPreview } from '@/components/ui/OcclusionPreview';
import { FileCategory } from '@/types/file';
import { useSession } from 'next-auth/react';
import { CollapsibleToothList } from '@/components/orders/CollapsibleToothCard';
import { generateCaseSummary } from '@/lib/orderSummaryGenerator';

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
  const [showOcclusionPreview, setShowOcclusionPreview] = useState(false);

  const apiEndpoint = `/api/${role}/orders/${orderId}`;
  const backUrl = `/${role}/orders`;

  // Check if order has both upper and lower scan files (for occlusion)
  const upperFiles = order?.files?.filter((f) => f.category === FileCategory.SCAN_UPPER) || [];
  const lowerFiles = order?.files?.filter((f) => f.category === FileCategory.SCAN_LOWER) || [];
  const hasOcclusionFiles = upperFiles.length > 0 && lowerFiles.length > 0;

  const upperFile = upperFiles[0];
  const lowerFile = lowerFiles[0];

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
          <div className="flex flex-wrap gap-2 self-start">
            {/* Status Badge */}
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusLabel(order.status)}
            </span>

            {/* Urgent Badge */}
            {order.isUrgent && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold bg-warning/10 text-warning">
                <Icons.zap className="h-4 w-4" />
                Urgente (+30%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Case Summary */}
      <div className="mb-6 rounded-xl bg-blue-50 border-2 border-blue-200 p-6 shadow-md">
        <div className="flex items-start gap-3">
          <Icons.fileText className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-blue-700 mb-3">Resumen del Caso</h2>
            <p className="text-base text-foreground leading-relaxed">
              {generateCaseSummary(order)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(generateCaseSummary(order));
                  } catch (err) {
                    console.error('Failed to copy:', err);
                  }
                }}
                className="!px-2 !py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
              >
                <Icons.copy className="h-3 w-3 mr-1" />
                Copiar resumen
              </Button>
            </div>
          </div>
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
              <CopyableField
                label="Tipo de Escaneo"
                value={order.scanType ? getScanTypeLabel(order.scanType) : null}
              />
            </dl>
            {order.aiPrompt && (
              <div className="mt-4">
                <CopyableField label="Prompt de IA" value={order.aiPrompt} />
              </div>
            )}
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

          {/* Teeth Configuration */}
          {order.teeth && order.teeth.length > 0 && (
            <div className="rounded-xl bg-background p-6 shadow-md border border-border">
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                Configuración de Dientes
              </h2>
              <CollapsibleToothList
                teeth={order.teeth}
                renderToothDetails={(tooth) => (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tooth.material && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Material</dt>
                        <dd className="text-sm text-foreground flex items-center">
                          {tooth.material}
                          <CopyButton value={tooth.material} label="material" />
                        </dd>
                      </div>
                    )}
                    {tooth.tipoRestauracion && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Tipo de Restauración
                        </dt>
                        <dd className="text-sm text-foreground capitalize flex items-center">
                          {tooth.tipoRestauracion}
                          <CopyButton value={tooth.tipoRestauracion} label="tipo de restauración" />
                        </dd>
                      </div>
                    )}
                    {tooth.trabajoSobreImplante && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Trabajo sobre Implante
                        </dt>
                        <dd className="text-sm text-foreground flex items-center">
                          Sí
                          <CopyButton value="Sí" label="trabajo sobre implante" />
                        </dd>
                      </div>
                    )}
                    {tooth.colorInfo && (
                      <div className="col-span-2">
                        <dt className="text-sm font-medium text-muted-foreground">
                          Información de Color
                        </dt>
                        <dd className="text-sm text-foreground">
                          <div className="flex items-center flex-wrap gap-2">
                            {(tooth.colorInfo as any).shadeType && (
                              <span>Sistema: {(tooth.colorInfo as any).shadeType}</span>
                            )}
                            {(tooth.colorInfo as any).shadeCode && (
                              <span>Código: {(tooth.colorInfo as any).shadeCode}</span>
                            )}
                            <CopyButton
                              value={`${(tooth.colorInfo as any).shadeType || ''} ${(tooth.colorInfo as any).shadeCode || ''}`.trim()}
                              label="información de color"
                            />
                          </div>
                        </dd>
                      </div>
                    )}
                    {tooth.informacionImplante && (
                      <div className="col-span-2">
                        <dt className="text-sm font-medium text-muted-foreground mb-2">
                          Información de Implante
                        </dt>
                        <dd className="text-sm text-foreground space-y-1">
                          {(tooth.informacionImplante as any).marcaImplante && (
                            <div className="flex items-center">
                              Marca: {(tooth.informacionImplante as any).marcaImplante}
                              <CopyButton
                                value={(tooth.informacionImplante as any).marcaImplante}
                                label="marca de implante"
                              />
                            </div>
                          )}
                          {(tooth.informacionImplante as any).sistemaConexion && (
                            <div className="flex items-center">
                              Sistema de Conexión:{' '}
                              {(tooth.informacionImplante as any).sistemaConexion}
                              <CopyButton
                                value={(tooth.informacionImplante as any).sistemaConexion}
                                label="sistema de conexión"
                              />
                            </div>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              />
            </div>
          )}

          {/* Files */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Archivos</h2>
              {hasOcclusionFiles && (
                <Button variant="secondary" size="sm" onClick={() => setShowOcclusionPreview(true)}>
                  <Icons.eye className="h-4 w-4 mr-2" />
                  Ver Vista de Oclusión
                </Button>
              )}
            </div>
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

          {/* Doctor Info */}
          <div className="rounded-xl bg-background p-6 shadow-md border border-border">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Doctor</h2>
            <dl className="space-y-3">
              <CopyableField label="Nombre" value={order.doctor.name} />
              <CopyableField label="Email" value={order.doctor.email} />
              <CopyableField label="Teléfono" value={order.doctor.phone} />
              <CopyableField label="Consultorio" value={order.doctor.clinicName} />
              <CopyableField label="Dirección" value={order.doctor.clinicAddress} />
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

      {/* Occlusion Preview Modal */}
      {showOcclusionPreview && hasOcclusionFiles && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOcclusionPreview(false);
            }
          }}
        >
          <div className="relative w-full max-w-5xl">
            <div className="rounded-lg bg-background p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Vista de Oclusión 3D</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOcclusionPreview(false)}
                  aria-label="Cerrar"
                  className="h-8 w-8 p-0"
                >
                  <Icons.x className="h-5 w-5" />
                </Button>
              </div>
              <OcclusionPreview
                upperUrl={upperFile?.storageUrl}
                lowerUrl={lowerFile?.storageUrl}
                onClose={() => setShowOcclusionPreview(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
