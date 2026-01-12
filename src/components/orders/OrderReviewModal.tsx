'use client';

import { useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { getScanTypeLabel } from '@/lib/scanTypeUtils';
import type { OrderFormState } from '@/components/clinic-staff/order-form/OrderForm.types';

interface OrderReviewModalProps {
  formData: OrderFormState;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function OrderReviewModal({
  formData,
  onConfirm,
  onCancel,
  isSubmitting,
}: OrderReviewModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel, isSubmitting]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => {
    if (!value) return null;
    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2 border-b border-border last:border-0">
        <dt className="font-semibold text-foreground sm:w-1/3">{label}:</dt>
        <dd className="text-muted-foreground sm:w-2/3 break-words">{value}</dd>
      </div>
    );
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-bold text-foreground mb-3 mt-6 first:mt-0 pb-2 border-b-2 border-primary">
      {children}
    </h3>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => {
        if (!isSubmitting && e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-background shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Revisar Orden Antes de Enviar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Verifica que toda la información sea correcta
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cerrar"
          >
            <Icons.x className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Patient Info */}
          <SectionTitle>Información del Paciente</SectionTitle>
          <dl className="space-y-1">
            <DetailRow label="Nombre del Paciente" value={formData.patientName} />
            <DetailRow label="ID del Paciente" value={formData.patientId} />
            <DetailRow label="Fecha de Entrega Deseada" value={formData.fechaEntregaDeseada} />
          </dl>

          {/* AI Prompt */}
          {formData.aiPrompt && (
            <>
              <SectionTitle>Prompt de IA</SectionTitle>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{formData.aiPrompt}</p>
              </div>
            </>
          )}

          {/* Description & Notes */}
          {(formData.description || formData.notes) && (
            <>
              <SectionTitle>Descripción y Notas</SectionTitle>
              <dl className="space-y-1">
                <DetailRow label="Descripción" value={formData.description} />
                <DetailRow label="Notas Adicionales" value={formData.notes} />
              </dl>
            </>
          )}

          {/* Dental Details */}
          <SectionTitle>Detalles Dentales</SectionTitle>
          <dl className="space-y-1">
            <DetailRow label="Números de Dientes" value={formData.teethNumbers} />
            <DetailRow label="Material" value={formData.material} />
            <DetailRow label="Marca del Material" value={formData.materialBrand} />
            <DetailRow label="Color" value={formData.color} />
            <DetailRow
              label="Tipo de Escaneo"
              value={formData.scanType ? getScanTypeLabel(formData.scanType) : undefined}
            />
          </dl>

          {/* Case Type */}
          {formData.tipoCaso && (
            <>
              <SectionTitle>Tipo de Caso</SectionTitle>
              <dl className="space-y-1">
                <DetailRow
                  label="Tipo de Caso"
                  value={formData.tipoCaso === 'nuevo' ? 'Nuevo' : 'Garantía'}
                />
                {formData.tipoCaso === 'garantia' && (
                  <>
                    <DetailRow label="Motivo de Garantía" value={formData.motivoGarantia} />
                    <DetailRow
                      label="Se Devuelve Trabajo Original"
                      value={formData.seDevuelveTrabajoOriginal ? 'Sí' : 'No'}
                    />
                  </>
                )}
              </dl>
            </>
          )}

          {/* Work Type */}
          {formData.tipoTrabajo && (
            <>
              <SectionTitle>Tipo de Trabajo</SectionTitle>
              <dl className="space-y-1">
                <DetailRow
                  label="Tipo de Trabajo"
                  value={formData.tipoTrabajo === 'restauracion' ? 'Restauración' : 'Otro'}
                />
                {formData.tipoRestauracion && (
                  <DetailRow label="Tipo de Restauración" value={formData.tipoRestauracion} />
                )}
              </dl>
            </>
          )}

          {/* Implant Info */}
          {formData.trabajoSobreImplante && formData.informacionImplante && (
            <>
              <SectionTitle>Información de Implantes</SectionTitle>
              <dl className="space-y-1">
                <DetailRow
                  label="Marca del Implante"
                  value={formData.informacionImplante.marcaImplante}
                />
                <DetailRow
                  label="Sistema de Conexión"
                  value={formData.informacionImplante.sistemaConexion}
                />
                <DetailRow
                  label="Número de Implantes"
                  value={formData.informacionImplante.numeroImplantes}
                />
                <DetailRow
                  label="Tipo de Restauración"
                  value={formData.informacionImplante.tipoRestauracion}
                />
                <DetailRow
                  label="Tipo de Aditamento"
                  value={formData.informacionImplante.tipoAditamento}
                />
                <DetailRow
                  label="Perfil de Emergencia"
                  value={formData.informacionImplante.perfilEmergencia}
                />
                <DetailRow
                  label="Condición del Tejido Blando"
                  value={formData.informacionImplante.condicionTejidoBlando}
                />
                <DetailRow
                  label="Radiografía Periapical"
                  value={formData.informacionImplante.radiografiaPeriapical}
                />
                <DetailRow label="CBCT" value={formData.informacionImplante.cbct} />
              </dl>
            </>
          )}

          {/* Submission Type */}
          {formData.submissionType && (
            <>
              <SectionTitle>Tipo de Envío</SectionTitle>
              <dl className="space-y-1">
                <DetailRow label="Tipo de Envío" value={formData.submissionType} />
                {formData.articulatedBy && (
                  <DetailRow
                    label="Articulado Por"
                    value={formData.articulatedBy === 'doctor' ? 'Doctor' : 'Laboratorio'}
                  />
                )}
              </dl>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex flex-col-reverse sm:flex-row gap-3 border-t border-border bg-background px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            fullWidth
            className="sm:w-auto"
          >
            Volver a Editar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            fullWidth
            className="sm:w-auto sm:flex-1"
          >
            {isSubmitting ? 'Enviando...' : 'Confirmar y Enviar para Revisión'}
          </Button>
        </div>
      </div>
    </div>
  );
}
