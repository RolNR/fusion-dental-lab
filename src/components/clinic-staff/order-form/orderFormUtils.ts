import { ScanType } from '@prisma/client';
import { OrderFormState, OrderFormData } from './OrderForm.types';
import {
  createOrder,
  updateOrder,
  submitOrderForReview,
  handleSuccessNavigation,
  OrderFiles,
} from '@/lib/api/orderFormHelpers';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ToothData } from '@/types/tooth';
import type { AISuggestion } from '@/types/ai-suggestions';

/**
 * Fetches the current doctor's information from the session
 */
export async function fetchCurrentDoctor(): Promise<string> {
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    return session?.user?.name || '';
  } catch (err) {
    console.error('Error fetching current doctor:', err);
    return '';
  }
}

/**
 * Fetches the list of doctors for assistants to select from
 */
export async function fetchDoctors() {
  try {
    const response = await fetch('/api/assistant/doctors');
    const data = await response.json();
    return data.doctors || [];
  } catch (err) {
    console.error('Error fetching doctors:', err);
    return [];
  }
}

/**
 * Validates digital scan file uploads
 */
export function validateDigitalScanFiles(
  scanType: ScanType | null,
  upperFile: File | null,
  lowerFile: File | null
): string | null {
  if (scanType === ScanType.DIGITAL_SCAN) {
    if (!upperFile || !lowerFile) {
      return 'Debes subir los archivos STL/PLY obligatorios: Superior e Inferior';
    }
  }
  return null;
}

/**
 * Handles order creation
 */
export async function handleCreateOrder(
  role: 'doctor' | 'assistant',
  formData: OrderFormState,
  files: OrderFiles,
  submitForReview: boolean
) {
  const newOrder = await createOrder(role, formData, files);

  if (submitForReview) {
    await submitOrderForReview(role, newOrder.id);
  }

  return newOrder;
}

/**
 * Handles order update
 */
export async function handleUpdateOrder(
  role: 'doctor' | 'assistant',
  orderId: string,
  formData: OrderFormState,
  files: OrderFiles,
  submitForReview: boolean
) {
  await updateOrder(role, orderId, formData, files);

  if (submitForReview) {
    await submitOrderForReview(role, orderId);
  }
}

/**
 * Main save order handler
 */
export async function saveOrder(
  orderId: string | undefined,
  role: 'doctor' | 'assistant',
  formData: OrderFormState,
  files: OrderFiles,
  submitForReview: boolean,
  onSuccess: (() => void) | undefined,
  router: AppRouterInstance
) {
  // Only validate digital scan files when submitting for review
  // Allow saving as draft even with missing required files
  if (submitForReview) {
    const validationError = validateDigitalScanFiles(
      formData.scanType,
      files.upperFile ?? null,
      files.lowerFile ?? null
    );

    if (validationError) {
      throw new Error(validationError);
    }
  }

  // Create or update order
  if (orderId) {
    await handleUpdateOrder(role, orderId, formData, files, submitForReview);
  } else {
    await handleCreateOrder(role, formData, files, submitForReview);
  }

  // Handle success navigation
  handleSuccessNavigation(onSuccess, router, role);
}

/**
 * Filters out null, undefined, and empty string values from an object
 */
function filterEmptyValues<T extends Record<string, any>>(obj: T): Partial<T> {
  const filtered: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Only include non-null, non-undefined, non-empty-string values
    if (value !== null && value !== undefined && value !== '') {
      filtered[key as keyof T] = value;
    }
  }

  return filtered;
}

/**
 * Parses AI prompt and returns structured order data with suggestions
 */
export async function parseAIPrompt(prompt: string): Promise<{
  confirmedValues: Partial<OrderFormState>;
  suggestions: AISuggestion[];
}> {
  const response = await fetch('/api/orders/parse-ai-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Error al procesar el prompt');
  }

  if (result.success && result.data) {
    const { confirmedValues, suggestions } = result.data;

    // Filter out any null/undefined/empty values from confirmed values
    return {
      confirmedValues: filterEmptyValues(confirmedValues),
      suggestions: suggestions || [],
    };
  }

  throw new Error('No se pudo procesar el prompt');
}

/**
 * Initializes form state from initial data
 */
export function initializeFormState(initialData?: OrderFormData): OrderFormState {
  return {
    patientName: initialData?.patientName || '',
    patientId: initialData?.patientId || '',
    description: initialData?.description || '',
    notes: initialData?.notes || '',
    fechaEntregaDeseada: initialData?.fechaEntregaDeseada || '',
    aiPrompt: initialData?.aiPrompt || '',
    teethNumbers: initialData?.teethNumbers || '',
    scanType: initialData?.scanType || null,
    doctorId: initialData?.doctorId || '',

    // Case type fields
    tipoCaso: initialData?.tipoCaso || 'nuevo',
    motivoGarantia: initialData?.motivoGarantia || '',
    seDevuelveTrabajoOriginal: initialData?.seDevuelveTrabajoOriginal || false,

    // Impression fields
    escanerUtilizado: initialData?.escanerUtilizado || null,
    otroEscaner: initialData?.otroEscaner || '',
    tipoSilicon: initialData?.tipoSilicon || null,
    notaModeloFisico: initialData?.notaModeloFisico || '',

    // Order-level fields (shared)
    materialSent: initialData?.materialSent,
    submissionType: initialData?.submissionType || null,
    oclusionDiseno: initialData?.oclusionDiseno,
    articulatedBy: initialData?.articulatedBy || null,

    // Urgent order
    isUrgent: initialData?.isUrgent || false,
  };
}

/**
 * Parse teeth numbers string into array
 */
export function parseTeethNumbers(teethNumbersStr: string | undefined): string[] {
  if (!teethNumbersStr?.trim()) {
    return [];
  }

  // Parse comma-separated teeth numbers
  return teethNumbersStr
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    // Remove duplicates
    .filter((t, idx, arr) => arr.indexOf(t) === idx)
    // Sort numerically
    .sort((a, b) => parseInt(a) - parseInt(b));
}

/**
 * Initialize teeth data Map from parsed teeth numbers
 */
export function initializeTeethData(
  parsedTeeth: string[],
  existingData: Map<string, ToothData>
): Map<string, ToothData> {
  const updated = new Map(existingData);

  // Add new teeth with empty configuration
  parsedTeeth.forEach((toothNumber) => {
    if (!updated.has(toothNumber)) {
      updated.set(toothNumber, { toothNumber });
    }
  });

  // Remove teeth that are no longer in the list
  Array.from(updated.keys()).forEach((toothNumber) => {
    if (!parsedTeeth.includes(toothNumber)) {
      updated.delete(toothNumber);
    }
  });

  return updated;
}

/**
 * Get the correct selected tooth (first available if current selection is invalid)
 */
export function getValidSelectedTooth(
  currentSelection: string | null,
  availableTeeth: string[]
): string | null {
  if (availableTeeth.length === 0) {
    return null;
  }

  // If current selection is valid, keep it
  if (currentSelection && availableTeeth.includes(currentSelection)) {
    return currentSelection;
  }

  // Otherwise, select the first tooth
  return availableTeeth[0];
}

/**
 * Copy tooth data from source to target teeth
 */
export function copyToothData(
  sourceToothNumber: string,
  targetToothNumbers: string[],
  teethData: Map<string, ToothData>
): Map<string, ToothData> {
  const sourceData = teethData.get(sourceToothNumber);
  if (!sourceData) {
    return teethData;
  }

  const updated = new Map(teethData);
  targetToothNumbers.forEach((toothNumber) => {
    updated.set(toothNumber, {
      ...sourceData,
      toothNumber, // Keep the tooth number unique
    });
  });

  return updated;
}
