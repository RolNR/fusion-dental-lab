'use client';

import { useEffect, useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import type { OrderFormState } from '@/components/clinic-staff/order-form/OrderForm.types';
import type { ToothData } from '@/types/tooth';
import type { AISuggestion } from '@/types/ai-suggestions';
import { hasNonWarrantyMaterials } from '@/lib/materialWarrantyUtils';
import {
  PatientInfoSection,
  AIPromptSection,
  AISuggestionsSection,
  DescriptionNotesSection,
  DentalDetailsSection,
  ToothConfigSection,
  CaseTypeSection,
  SubmissionTypeSection,
  OcclusionDesignSection,
  WarrantyDisclaimerSection,
  FilesReviewSection,
} from './review-sections';

interface OrderReviewModalProps {
  formData: OrderFormState & { teeth?: ToothData[] };
  suggestions?: AISuggestion[];
  onApplySuggestion?: (suggestion: AISuggestion) => void;
  // File upload props
  upperFiles: File[];
  lowerFiles: File[];
  biteFiles: File[];
  photographFiles: File[];
  otherFiles: File[];
  onUpperFilesChange: (files: File[]) => void;
  onLowerFilesChange: (files: File[]) => void;
  onBiteFilesChange: (files: File[]) => void;
  onPhotographFilesChange: (files: File[]) => void;
  onOtherFilesChange: (files: File[]) => void;
  // Form field edit handlers
  onFormDataChange?: (updates: Partial<OrderFormState>) => void;
  // Validation errors
  validationErrors?: {
    patientName?: string;
    fechaEntregaDeseada?: string;
    description?: string;
    notes?: string;
  };
  // Actions
  onConfirm: () => void;
  onCancel: () => void;
  onSaveAsDraft?: () => void;
  isSubmitting: boolean;
  isSavingDraft?: boolean;
}

export function OrderReviewModal({
  formData,
  suggestions = [],
  onApplySuggestion,
  upperFiles,
  lowerFiles,
  biteFiles,
  photographFiles,
  otherFiles,
  onUpperFilesChange,
  onLowerFilesChange,
  onBiteFilesChange,
  onPhotographFilesChange,
  onOtherFilesChange,
  onFormDataChange,
  validationErrors,
  onConfirm,
  onCancel,
  onSaveAsDraft,
  isSubmitting,
  isSavingDraft = false,
}: OrderReviewModalProps) {
  // Warranty disclaimer state
  const requiresWarrantyAcceptance = hasNonWarrantyMaterials(formData.materialSent);
  const [warrantyAccepted, setWarrantyAccepted] = useState(false);

  // Validation state
  const [localErrors, setLocalErrors] = useState<{
    patientName?: string;
    fechaEntregaDeseada?: string;
    teeth?: string;
    teethIncomplete?: string[];
    digitalScanFiles?: string;
  }>({});

  // Validate required fields on mount and when formData changes
  useEffect(() => {
    const errors: typeof localErrors = {};

    if (!formData.patientName || formData.patientName.trim() === '') {
      errors.patientName = 'El nombre del paciente es requerido';
    }

    // Validate teeth selection
    if (!formData.teeth || formData.teeth.length === 0) {
      errors.teeth = 'Al menos un diente debe ser configurado';
    } else {
      // Check if any teeth are missing required fields
      const incompleteTeeth: string[] = [];
      for (const tooth of formData.teeth) {
        const missingFields: string[] = [];
        if (!tooth.material) missingFields.push('material');
        if (!tooth.tipoRestauracion) missingFields.push('tipo de restauración');

        if (missingFields.length > 0) {
          incompleteTeeth.push(`Diente ${tooth.toothNumber}: falta ${missingFields.join(', ')}`);
        }
      }
      if (incompleteTeeth.length > 0) {
        errors.teethIncomplete = incompleteTeeth;
      }
    }

    // Validate digital scan files - require upper AND lower when scan type is DIGITAL_SCAN
    if (formData.scanType === 'DIGITAL_SCAN') {
      const missingFiles: string[] = [];
      if (upperFiles.length === 0) missingFiles.push('arcada superior');
      if (lowerFiles.length === 0) missingFiles.push('arcada inferior');

      if (missingFiles.length > 0) {
        errors.digitalScanFiles = `Escaneo digital requiere archivos STL/PLY de: ${missingFiles.join(' y ')}`;
      }
    }

    setLocalErrors(errors);
  }, [formData.patientName, formData.teeth, formData.scanType, upperFiles, lowerFiles]);

  // Check if form is valid for submission
  const hasValidationErrors = Object.keys(localErrors).length > 0;

  // Field change handlers
  const handlePatientNameChange = (value: string) => {
    onFormDataChange?.({ patientName: value });
  };

  const handleFechaEntregaChange = (value: string) => {
    onFormDataChange?.({ fechaEntregaDeseada: value });
  };

  const handleDescriptionChange = (value: string) => {
    onFormDataChange?.({ description: value });
  };

  const handleNotesChange = (value: string) => {
    onFormDataChange?.({ notes: value });
  };

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
            <h2 className="text-xl font-bold text-foreground">Revisar Orden</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Verifica que toda la información sea correcta. Podrás añadir archivos después de crear
              la orden.
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
          {/* Validation Error Summary */}
          {hasValidationErrors && (
            <div className="mb-6 rounded-lg bg-danger/10 border border-danger/30 p-4">
              <div className="flex items-start gap-3">
                <Icons.alertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-danger mb-2">Campos Requeridos Faltantes</h3>
                  <ul className="text-sm text-danger/80 space-y-1">
                    {localErrors.patientName && <li>• {localErrors.patientName}</li>}
                    {localErrors.teeth && <li>• {localErrors.teeth}</li>}
                    {localErrors.teethIncomplete && localErrors.teethIncomplete.length > 0 && (
                      <li>
                        • Dientes con información incompleta:
                        <ul className="ml-4 mt-1 space-y-0.5">
                          {localErrors.teethIncomplete.map((error, idx) => (
                            <li key={idx} className="text-xs">
                              - {error}
                            </li>
                          ))}
                        </ul>
                      </li>
                    )}
                    {localErrors.digitalScanFiles && <li>• {localErrors.digitalScanFiles}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <PatientInfoSection
            patientName={formData.patientName}
            patientId={formData.patientId}
            fechaEntregaDeseada={formData.fechaEntregaDeseada}
            onPatientNameChange={onFormDataChange ? handlePatientNameChange : undefined}
            onFechaEntregaChange={onFormDataChange ? handleFechaEntregaChange : undefined}
            errors={localErrors}
          />

          <AIPromptSection aiPrompt={formData.aiPrompt} />

          {suggestions.length > 0 && onApplySuggestion && (
            <AISuggestionsSection suggestions={suggestions} onApplySuggestion={onApplySuggestion} />
          )}

          <DescriptionNotesSection
            description={formData.description}
            notes={formData.notes}
            isUrgent={formData.isUrgent}
            onDescriptionChange={onFormDataChange ? handleDescriptionChange : undefined}
            onNotesChange={onFormDataChange ? handleNotesChange : undefined}
          />

          <DentalDetailsSection teethNumbers={formData.teethNumbers} scanType={formData.scanType} />

          <ToothConfigSection teeth={formData.teeth} />

          <FilesReviewSection
            upperFiles={upperFiles}
            lowerFiles={lowerFiles}
            biteFiles={biteFiles}
            photographFiles={photographFiles}
            otherFiles={otherFiles}
            onUpperFilesChange={onUpperFilesChange}
            onLowerFilesChange={onLowerFilesChange}
            onBiteFilesChange={onBiteFilesChange}
            onPhotographFilesChange={onPhotographFilesChange}
            onOtherFilesChange={onOtherFilesChange}
          />

          <CaseTypeSection
            tipoCaso={formData.tipoCaso ?? undefined}
            motivoGarantia={formData.motivoGarantia}
            seDevuelveTrabajoOriginal={formData.seDevuelveTrabajoOriginal}
          />

          <SubmissionTypeSection
            submissionType={formData.submissionType}
            articulatedBy={formData.articulatedBy}
          />

          <OcclusionDesignSection oclusionDiseno={formData.oclusionDiseno} />

          <WarrantyDisclaimerSection
            materialSent={formData.materialSent}
            accepted={warrantyAccepted}
            onAcceptChange={setWarrantyAccepted}
          />
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
            disabled={
              isSubmitting ||
              isSavingDraft ||
              hasValidationErrors ||
              (requiresWarrantyAcceptance && !warrantyAccepted)
            }
            fullWidth
            className="sm:w-auto sm:flex-1"
          >
            {isSubmitting ? 'Creando...' : 'Crear Orden'}
          </Button>
        </div>
      </div>
    </div>
  );
}
