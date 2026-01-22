import { ScanType } from '@prisma/client';
import { OrderFormState, OrderFormData } from './OrderForm.types';
import {
  createOrder,
  updateOrder,
  submitOrderForReview,
  handleSuccessNavigation,
} from '@/lib/api/orderFormHelpers';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ToothData } from '@/types/tooth';
import type { AISuggestion } from '@/types/ai-suggestions';
import { FileCategory } from '@/types/file';
import { getFileMimeType } from '@/lib/fileUtils';

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
 * Handles order creation
 */
export async function handleCreateOrder(
  role: 'doctor' | 'assistant',
  formData: OrderFormState,
  submitForReview: boolean
) {
  const newOrder = await createOrder(role, formData);

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
  submitForReview: boolean
) {
  await updateOrder(role, orderId, formData);

  if (submitForReview) {
    await submitOrderForReview(role, orderId);
  }
}

/**
 * Main save order handler - files are uploaded separately after order creation
 */
export async function saveOrder(
  orderId: string | undefined,
  role: 'doctor' | 'assistant',
  formData: OrderFormState,
  submitForReview: boolean,
  onSuccess: (() => void) | undefined,
  router: AppRouterInstance
): Promise<{ id: string } | void> {
  // Create or update order
  if (orderId) {
    await handleUpdateOrder(role, orderId, formData, submitForReview);
    // Handle success navigation for updates
    handleSuccessNavigation(onSuccess, router, role);
  } else {
    const newOrder = await handleCreateOrder(role, formData, submitForReview);
    // Return new order so caller can redirect to detail page
    return newOrder;
  }
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
    tipoCaso: initialData?.tipoCaso || null,
    motivoGarantia: initialData?.motivoGarantia || '',
    seDevuelveTrabajoOriginal: initialData?.seDevuelveTrabajoOriginal || false,
    escanerUtilizado: initialData?.escanerUtilizado || null,
    otroEscaner: initialData?.otroEscaner || '',
    tipoSilicon: initialData?.tipoSilicon || null,
    notaModeloFisico: initialData?.notaModeloFisico || '',
    materialSent: initialData?.materialSent || {},
    submissionType: initialData?.submissionType || null,
    oclusionDiseno: initialData?.oclusionDiseno,
    articulatedBy: initialData?.articulatedBy || null,
    isUrgent: initialData?.isUrgent || false,
    doctorId: initialData?.doctorId || '',
  };
}

/**
 * Parses teeth numbers from comma-separated string into array
 */
export function parseTeethNumbers(teethNumbers: string): string[] {
  if (!teethNumbers || teethNumbers.trim() === '') {
    return [];
  }

  return teethNumbers
    .split(',')
    .map((num) => num.trim())
    .filter((num) => num !== '');
}

/**
 * Initializes teeth data map from teeth numbers array
 */
export function initializeTeethData(
  teethNumbers: string[],
  existingTeeth?: ToothData[]
): Map<string, ToothData> {
  const teethMap = new Map<string, ToothData>();

  // If we have existing teeth data, use it
  if (existingTeeth && existingTeeth.length > 0) {
    existingTeeth.forEach((tooth) => {
      teethMap.set(tooth.toothNumber, tooth);
    });
    return teethMap;
  }

  // Otherwise create minimal tooth entries
  teethNumbers.forEach((toothNumber) => {
    teethMap.set(toothNumber, {
      toothNumber,
      material: undefined,
      materialBrand: undefined,
      colorInfo: null,
      tipoTrabajo: null,
      tipoRestauracion: null,
      trabajoSobreImplante: false,
      informacionImplante: null,
    });
  });

  return teethMap;
}

/**
 * Gets a valid selected tooth number, ensuring it exists in the current teeth data
 */
export function getValidSelectedTooth(
  currentSelected: string | null,
  teethData: Map<string, ToothData>
): string | null {
  if (currentSelected && teethData.has(currentSelected)) {
    return currentSelected;
  }

  // Return first tooth if current selection is invalid
  const firstTooth = Array.from(teethData.keys())[0];
  return firstTooth || null;
}

/**
 * Copies tooth data from source tooth to target teeth
 */
export function copyToothData(
  sourceTooth: string,
  targetTeeth: string[],
  teethData: Map<string, ToothData>
): Map<string, ToothData> {
  const newTeethData = new Map(teethData);
  const sourceData = newTeethData.get(sourceTooth);

  if (!sourceData) {
    return newTeethData;
  }

  // Copy all properties except toothNumber
  targetTeeth.forEach((toothNumber) => {
    if (toothNumber !== sourceTooth) {
      newTeethData.set(toothNumber, {
        ...sourceData,
        toothNumber,
      });
    }
  });

  return newTeethData;
}

/**
 * Upload a single file to R2 via pre-signed URL with progress tracking
 */
async function uploadFileToR2(
  orderId: string,
  file: File,
  category: FileCategory,
  onProgress?: (progress: number) => void
): Promise<void> {
  const mimeType = getFileMimeType(file);

  // Step 1: Get pre-signed URL
  const uploadUrlResponse = await fetch(`/api/orders/${orderId}/files/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      category,
    }),
  });

  if (!uploadUrlResponse.ok) {
    const data = await uploadUrlResponse.json();
    throw new Error(data.error || 'Error al generar URL de carga');
  }

  const { uploadUrl, storageKey } = await uploadUrlResponse.json();

  // Step 2: Upload to R2 using XMLHttpRequest for progress tracking
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error('Error al subir archivo a R2'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Error de red al subir archivo'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.send(file);
  });

  // Step 3: Process upload and save metadata
  const processResponse = await fetch(`/api/orders/${orderId}/files/process-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storageKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      category,
    }),
  });

  if (!processResponse.ok) {
    const data = await processResponse.json();
    throw new Error(data.error || 'Error al procesar carga');
  }
}

/**
 * Upload multiple files to an order with progress tracking
 */
export async function uploadFilesToOrder(
  orderId: string,
  upperFiles: File[],
  lowerFiles: File[],
  biteFiles: File[],
  photographFiles: File[],
  otherFiles: File[],
  onProgress?: (uploadedCount: number, totalCount: number, currentFileName: string, currentProgress: number) => void
): Promise<void> {
  // Collect all files with their categories
  const filesToUpload: Array<{ file: File; category: FileCategory }> = [];

  upperFiles.forEach((file) => {
    filesToUpload.push({ file, category: FileCategory.SCAN_UPPER });
  });

  lowerFiles.forEach((file) => {
    filesToUpload.push({ file, category: FileCategory.SCAN_LOWER });
  });

  biteFiles.forEach((file) => {
    filesToUpload.push({ file, category: FileCategory.SCAN_BITE });
  });

  photographFiles.forEach((file) => {
    filesToUpload.push({ file, category: FileCategory.PHOTOGRAPH });
  });

  otherFiles.forEach((file) => {
    filesToUpload.push({ file, category: FileCategory.OTHER });
  });

  const totalCount = filesToUpload.length;

  // Upload files sequentially to track progress better
  for (let i = 0; i < filesToUpload.length; i++) {
    const { file, category } = filesToUpload[i];

    await uploadFileToR2(orderId, file, category, (progress) => {
      if (onProgress) {
        onProgress(i, totalCount, file.name, progress);
      }
    });
  }
}
