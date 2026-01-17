'use client';

import { useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { getScanTypeLabel } from '@/lib/scanTypeUtils';
import type { OrderFormState } from '@/components/clinic-staff/order-form/OrderForm.types';
import type { ToothData } from '@/types/tooth';
import { Odontogram } from '@/components/clinic-staff/order-form/Odontogram';

interface OrderReviewModalProps {
  formData: OrderFormState & { teeth?: ToothData[] };
  onConfirm: () => void;
  onCancel: () => void;
  onSaveAsDraft?: () => void;
  isSubmitting: boolean;
  isSavingDraft?: boolean;
}

export function OrderReviewModal({
  formData,
  onConfirm,
  onCancel,
  onSaveAsDraft,
  isSubmitting,
  isSavingDraft = false,
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
            <DetailRow
              label="Fecha de Entrega Deseada"
              value={
                formData.fechaEntregaDeseada
                  ? new Date(formData.fechaEntregaDeseada).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : undefined
              }
            />
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
            <DetailRow
              label="Tipo de Escaneo"
              value={formData.scanType ? getScanTypeLabel(formData.scanType) : undefined}
            />
          </dl>

          {/* Per-Tooth Configuration */}
          {formData.teeth && formData.teeth.length > 0 && (
            <>
              <SectionTitle>Configuración por Diente</SectionTitle>

              {/* Visual Odontogram (read-only) */}
              <div className="mb-6">
                <Odontogram
                  selectedTeeth={formData.teeth.map((t) => t.toothNumber)}
                  currentTooth={null}
                  teethWithData={
                    new Set(
                      formData.teeth
                        .filter((t) => t.material || t.tipoTrabajo || t.trabajoSobreImplante)
                        .map((t) => t.toothNumber)
                    )
                  }
                  teethWithErrors={new Set()}
                  readOnly={true}
                />
              </div>

              {/* Detailed configuration for each tooth */}
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Detalles por Diente
              </h3>
              <div className="space-y-4">
                {formData.teeth.map((tooth) => (
                  <div
                    key={tooth.toothNumber}
                    className="rounded-lg border-l-4 border-primary bg-muted/20 pl-4 pr-4 py-3"
                  >
                    <h4 className="font-semibold text-lg text-foreground mb-2">
                      Diente {tooth.toothNumber}
                    </h4>
                    <dl className="space-y-1">
                      {tooth.tipoTrabajo && (
                        <DetailRow
                          label="Tipo de Trabajo"
                          value={
                            tooth.tipoTrabajo === 'restauracion' ? 'Restauración' : 'Otro'
                          }
                        />
                      )}
                      {tooth.tipoRestauracion && (
                        <DetailRow
                          label="Tipo de Restauración"
                          value={
                            tooth.tipoRestauracion === 'corona'
                              ? 'Corona'
                              : tooth.tipoRestauracion === 'puente'
                                ? 'Puente'
                                : tooth.tipoRestauracion === 'inlay'
                                  ? 'Inlay'
                                  : tooth.tipoRestauracion === 'onlay'
                                    ? 'Onlay'
                                    : tooth.tipoRestauracion === 'carilla'
                                      ? 'Carilla'
                                      : 'Provisional'
                          }
                        />
                      )}
                      {tooth.material && <DetailRow label="Material" value={tooth.material} />}
                      {tooth.materialBrand && (
                        <DetailRow label="Marca del Material" value={tooth.materialBrand} />
                      )}
                      {tooth.colorInfo && typeof tooth.colorInfo === 'object' && (
                        <>
                          {(tooth.colorInfo as any).shadeCode && (
                            <DetailRow
                              label="Código de Color"
                              value={(tooth.colorInfo as any).shadeCode}
                            />
                          )}
                          {(tooth.colorInfo as any).shadeType && (
                            <DetailRow
                              label="Tipo de Guía de Color"
                              value={(tooth.colorInfo as any).shadeType}
                            />
                          )}
                        </>
                      )}
                      {tooth.trabajoSobreImplante && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-sm font-medium text-foreground mb-1">
                            Trabajo sobre Implante
                          </p>
                          {tooth.informacionImplante &&
                            typeof tooth.informacionImplante === 'object' && (
                              <dl className="ml-4 space-y-1">
                                {(tooth.informacionImplante as any).marcaImplante && (
                                  <DetailRow
                                    label="Marca del Implante"
                                    value={(tooth.informacionImplante as any).marcaImplante}
                                  />
                                )}
                                {(tooth.informacionImplante as any).sistemaConexion && (
                                  <DetailRow
                                    label="Sistema de Conexión"
                                    value={(tooth.informacionImplante as any).sistemaConexion}
                                  />
                                )}
                                {(tooth.informacionImplante as any).numeroImplantes && (
                                  <DetailRow
                                    label="Número de Implantes"
                                    value={(tooth.informacionImplante as any).numeroImplantes}
                                  />
                                )}
                              </dl>
                            )}
                        </div>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            </>
          )}

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

          {/* Occlusion Design */}
          {formData.oclusionDiseno && (
            <>
              <SectionTitle>Diseño de Oclusión</SectionTitle>
              <dl className="space-y-1">
                <DetailRow
                  label="Tipo de Oclusión"
                  value={
                    formData.oclusionDiseno.tipoOclusion === 'normal'
                      ? 'Normal'
                      : formData.oclusionDiseno.tipoOclusion === 'clase_i'
                        ? 'Clase I'
                        : formData.oclusionDiseno.tipoOclusion === 'clase_ii'
                          ? 'Clase II'
                          : formData.oclusionDiseno.tipoOclusion === 'clase_iii'
                            ? 'Clase III'
                            : formData.oclusionDiseno.tipoOclusion === 'borde_a_borde'
                              ? 'Borde a Borde'
                              : 'Mordida Cruzada'
                  }
                />
                <DetailRow
                  label="Espacio Interoclusal Suficiente"
                  value={formData.oclusionDiseno.espacioInteroclusalSuficiente ? 'Sí' : 'No'}
                />
                {formData.oclusionDiseno.solucionEspacioInsuficiente && (
                  <DetailRow
                    label="Solución para Espacio Insuficiente"
                    value={
                      formData.oclusionDiseno.solucionEspacioInsuficiente === 'reduccion_oclusal'
                        ? 'Reducción Oclusal'
                        : formData.oclusionDiseno.solucionEspacioInsuficiente === 'aumento_vertical'
                          ? 'Aumento Vertical'
                          : 'Ambas'
                    }
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
            disabled={isSubmitting || isSavingDraft}
            fullWidth
            className="sm:w-auto"
          >
            Volver a Editar
          </Button>
          {onSaveAsDraft && (
            <Button
              type="button"
              variant="secondary"
              onClick={onSaveAsDraft}
              isLoading={isSavingDraft}
              disabled={isSubmitting || isSavingDraft}
              fullWidth
              className="sm:w-auto sm:flex-1"
            >
              {isSavingDraft ? 'Guardando...' : 'Guardar como Borrador'}
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            isLoading={isSubmitting}
            disabled={isSubmitting || isSavingDraft}
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
