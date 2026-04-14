import { useMemo } from 'react';
import type { OrderFormState } from './OrderForm.types';
import type { ToothData } from '@/types/tooth';

export interface TicketFieldStatus {
  ok: boolean;
  message?: string;
}

export interface OrderTicketValidation {
  isCaseTypeMissing: boolean;
  isPatientNameMissing: boolean;
  isDeliveryDateMissing: boolean;
  isWarrantyReasonMissing: boolean; // only for garantia case
  isTeethMissing: boolean; // no teeth at all
  incompleteTeethLabels: string[]; // e.g. ["Diente 11: falta material"]
  isScanMissingFiles: boolean;
  scanMissingArches: string[]; // ["arcada superior", "arcada inferior"]
  missingCount: number;
  hasBlockingErrors: boolean;
}

interface ValidationInput {
  formData: OrderFormState & { teeth?: ToothData[] };
  upperFiles: File[];
  lowerFiles: File[];
}

/**
 * Computes live validation state for the order ticket. Pure function — no
 * side effects or async. The ticket re-renders on every form change and
 * reads from this to decide which rows should be red.
 */
export function useOrderValidation({
  formData,
  upperFiles,
  lowerFiles,
}: ValidationInput): OrderTicketValidation {
  return useMemo(() => {
    const isWarrantyCase = formData.tipoCaso === 'garantia';
    const isRepairCase =
      formData.tipoCaso === 'reparacion_ajuste' || formData.tipoCaso === 'regreso_prueba';

    const isCaseTypeMissing = !formData.tipoCaso;
    const isPatientNameMissing = !formData.patientName || formData.patientName.trim() === '';
    const isDeliveryDateMissing =
      !formData.fechaEntregaDeseada || formData.fechaEntregaDeseada.trim() === '';
    const isWarrantyReasonMissing =
      isWarrantyCase && (!formData.motivoGarantia || formData.motivoGarantia.trim() === '');

    // Teeth validation — skipped for warranty/repair cases
    let isTeethMissing = false;
    const incompleteTeethLabels: string[] = [];

    if (!isWarrantyCase && !isRepairCase) {
      if (!formData.teeth || formData.teeth.length === 0) {
        isTeethMissing = true;
      } else {
        for (const tooth of formData.teeth) {
          const missing: string[] = [];
          if (!tooth.material) missing.push('material');
          if (!tooth.tipoRestauracion) missing.push('tipo de restauración');
          if (missing.length > 0) {
            incompleteTeethLabels.push(`Diente ${tooth.toothNumber}: falta ${missing.join(', ')}`);
          }
        }
      }
    }

    // Digital scan files — skipped for warranty/repair cases
    const scanMissingArches: string[] = [];
    if (!isWarrantyCase && !isRepairCase && formData.isDigitalScan) {
      if (upperFiles.length === 0) scanMissingArches.push('arcada superior');
      if (lowerFiles.length === 0) scanMissingArches.push('arcada inferior');
    }
    const isScanMissingFiles = scanMissingArches.length > 0;

    const missingCount =
      (isCaseTypeMissing ? 1 : 0) +
      (isPatientNameMissing ? 1 : 0) +
      (isDeliveryDateMissing ? 1 : 0) +
      (isWarrantyReasonMissing ? 1 : 0) +
      (isTeethMissing ? 1 : 0) +
      incompleteTeethLabels.length +
      scanMissingArches.length;

    const hasBlockingErrors =
      isCaseTypeMissing ||
      isPatientNameMissing ||
      isDeliveryDateMissing ||
      isWarrantyReasonMissing ||
      isTeethMissing ||
      incompleteTeethLabels.length > 0 ||
      isScanMissingFiles;

    return {
      isCaseTypeMissing,
      isPatientNameMissing,
      isDeliveryDateMissing,
      isWarrantyReasonMissing,
      isTeethMissing,
      incompleteTeethLabels,
      isScanMissingFiles,
      scanMissingArches,
      missingCount,
      hasBlockingErrors,
    };
  }, [
    formData.tipoCaso,
    formData.patientName,
    formData.fechaEntregaDeseada,
    formData.motivoGarantia,
    formData.teeth,
    formData.isDigitalScan,
    upperFiles,
    lowerFiles,
  ]);
}
