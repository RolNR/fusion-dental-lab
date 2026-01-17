import type { ToothData } from '@/types/tooth';
import type { OrderFormState } from '@/components/clinic-staff/order-form/OrderForm.types';
import type { OcclusionInfo } from '@/types/order';
import type { ScanType, CaseType, SubmissionType } from '@prisma/client';

interface ParsedAIData {
  teeth?: ToothData[];
  patientName?: string;
  patientId?: string;
  description?: string;
  notes?: string;
  teethNumbers?: string;
  scanType?: ScanType | null;
  fechaEntregaDeseada?: string;
  tipoCaso?: CaseType;
  motivoGarantia?: string;
  seDevuelveTrabajoOriginal?: boolean;
  submissionType?: SubmissionType | null;
  articulatedBy?: 'doctor' | 'laboratorio';
  oclusionDiseno?: OcclusionInfo;
  [key: string]: unknown; // Allow additional fields
}

interface DashboardAIData {
  aiPrompt: string;
  parsedData: ParsedAIData;
  openReviewModal: boolean;
}

interface LoadedAIData {
  formData: Partial<OrderFormState>;
  teethData: Map<string, ToothData>;
  teethNumbers: string[];
  selectedToothNumber: string | null;
  shouldShowFullForm: boolean;
  shouldShowReviewModal: boolean;
}

/**
 * Loads AI-parsed data from sessionStorage (set by dashboard AI prompt)
 * Returns null if no data exists, otherwise returns structured data to apply to form
 */
export function loadDashboardAIData(): LoadedAIData | null {
  if (typeof window === 'undefined') return null;

  const dashboardData = sessionStorage.getItem('dashboardAIData');
  if (!dashboardData) return null;

  try {
    const { aiPrompt, parsedData, openReviewModal }: DashboardAIData = JSON.parse(dashboardData);

    // Clear session storage immediately
    sessionStorage.removeItem('dashboardAIData');

    // Extract teeth array if present
    const { teeth, ...otherData } = parsedData;

    // Build teeth data map
    const teethMap = new Map<string, ToothData>();
    let teethNumbersArray: string[] = [];
    let selectedTooth: string | null = null;

    if (teeth && Array.isArray(teeth) && teeth.length > 0) {
      teeth.forEach((tooth: ToothData) => {
        if (tooth.toothNumber) {
          teethMap.set(tooth.toothNumber, tooth);
        }
      });

      teethNumbersArray = Array.from(teethMap.keys());

      // Select first tooth if teeth exist
      if (teethMap.size > 0) {
        selectedTooth = teethNumbersArray[0];
      }
    }

    return {
      formData: {
        ...otherData,
        aiPrompt,
        // Preserve patient name if AI provided it
        patientName: otherData.patientName,
      },
      teethData: teethMap,
      teethNumbers: teethNumbersArray,
      selectedToothNumber: selectedTooth,
      shouldShowFullForm: true,
      shouldShowReviewModal: openReviewModal,
    };
  } catch (error) {
    console.error('Error loading dashboard AI data:', error);
    sessionStorage.removeItem('dashboardAIData'); // Clean up corrupted data
    return null;
  }
}
