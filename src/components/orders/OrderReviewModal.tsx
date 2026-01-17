'use client';

import { useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import type { OrderFormState } from '@/components/clinic-staff/order-form/OrderForm.types';
import type { ToothData } from '@/types/tooth';
import {
  PatientInfoSection,
  AIPromptSection,
  DescriptionNotesSection,
  DentalDetailsSection,
  ToothConfigSection,
  CaseTypeSection,
  SubmissionTypeSection,
  OcclusionDesignSection,
} from './review-sections';

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
          <PatientInfoSection
            patientName={formData.patientName}
            patientId={formData.patientId}
            fechaEntregaDeseada={formData.fechaEntregaDeseada}
          />

          <AIPromptSection aiPrompt={formData.aiPrompt} />

          <DescriptionNotesSection description={formData.description} notes={formData.notes} />

          <DentalDetailsSection teethNumbers={formData.teethNumbers} scanType={formData.scanType} />

          <ToothConfigSection teeth={formData.teeth} />

          <CaseTypeSection
            tipoCaso={formData.tipoCaso}
            motivoGarantia={formData.motivoGarantia}
            seDevuelveTrabajoOriginal={formData.seDevuelveTrabajoOriginal}
          />

          <SubmissionTypeSection
            submissionType={formData.submissionType}
            articulatedBy={formData.articulatedBy}
          />

          <OcclusionDesignSection oclusionDiseno={formData.oclusionDiseno} />
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
