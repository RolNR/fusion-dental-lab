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
  lowerFile: File | null,
  biteFile: File | null
): string | null {
  if (scanType === ScanType.DIGITAL_SCAN) {
    if (!upperFile || !lowerFile || !biteFile) {
      return 'Debes subir los archivos STL/PLY obligatorios: Superior, Inferior y Mordida';
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
  // Validate digital scan files
  const validationError = validateDigitalScanFiles(
    formData.scanType,
    files.upperFile ?? null,
    files.lowerFile ?? null,
    files.biteFile ?? null
  );

  if (validationError) {
    throw new Error(validationError);
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
 * Parses AI prompt and returns structured order data
 */
export async function parseAIPrompt(prompt: string): Promise<Partial<OrderFormState>> {
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
    // Filter out any null/undefined/empty values before returning
    return filterEmptyValues(result.data);
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
    material: initialData?.material || '',
    materialBrand: initialData?.materialBrand || '',
    scanType: initialData?.scanType || null,
    doctorId: initialData?.doctorId || '',
    // New fields
    tipoCaso: initialData?.tipoCaso || 'nuevo',
    motivoGarantia: initialData?.motivoGarantia || '',
    seDevuelveTrabajoOriginal: initialData?.seDevuelveTrabajoOriginal || false,
    tipoTrabajo: initialData?.tipoTrabajo || 'restauracion',
    tipoRestauracion: initialData?.tipoRestauracion || null,
    escanerUtilizado: initialData?.escanerUtilizado || null,
    otroEscaner: initialData?.otroEscaner || '',
    tipoSilicon: initialData?.tipoSilicon || null,
    notaModeloFisico: initialData?.notaModeloFisico || '',
    trabajoSobreImplante: initialData?.trabajoSobreImplante || false,
    informacionImplante: initialData?.informacionImplante,
    materialSent: initialData?.materialSent,
    submissionType: initialData?.submissionType || null,
    oclusionDiseno: initialData?.oclusionDiseno,
    colorInfo: initialData?.colorInfo,
    articulatedBy: initialData?.articulatedBy || null,
  };
}
