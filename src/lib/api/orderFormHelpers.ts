/**
 * Helper functions for OrderForm operations
 */

import { buildOrdersPath, buildOrderPath, buildOrderSubmitPath } from './paths';
import { getFileMimeType } from '@/lib/fileUtils';
import { OrderFormData } from '@/components/clinic-staff/order-form/OrderForm.types';

type RoleType = 'doctor' | 'assistant';

export interface OrderFiles {
  upperFile?: File | null;
  lowerFile?: File | null;
  mouthPhotoFile?: File | null;
}

/**
 * Upload a single file to R2 via pre-signed URL
 */
async function uploadFileToR2(orderId: string, file: File, category: string): Promise<void> {
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

  // Step 2: Upload to R2
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': mimeType,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Error al subir archivo a R2');
  }

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
 * Upload files to R2 after order creation
 */
async function uploadFilesToR2(orderId: string, files: OrderFiles): Promise<void> {
  const uploads: Promise<void>[] = [];

  if (files.upperFile) {
    uploads.push(uploadFileToR2(orderId, files.upperFile, 'scanUpper'));
  }
  if (files.lowerFile) {
    uploads.push(uploadFileToR2(orderId, files.lowerFile, 'scanLower'));
  }
  if (files.mouthPhotoFile) {
    uploads.push(uploadFileToR2(orderId, files.mouthPhotoFile, 'mouthPhoto'));
  }

  // Upload all files in parallel
  await Promise.all(uploads);
}

/**
 * Create a new order
 */
export async function createOrder(
  role: RoleType,
  formData: OrderFormData,
  files?: OrderFiles
): Promise<{ id: string }> {
  // Step 1: Create order (JSON only, no files)
  const response = await fetch(buildOrdersPath(role), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await response.json();
  if (!response.ok) {
    // Preserve validation error details if present
    if (data.details && Array.isArray(data.details)) {
      const error = new Error(data.error || 'Error al crear orden') as Error & {
        details: Array<{ path?: string[]; message?: string }>;
        error?: string;
      };
      error.details = data.details;
      error.error = data.error;
      throw error;
    }
    throw new Error(data.error || 'Error al crear orden');
  }

  const order = data.order;

  // Step 2: Upload files to R2 if provided
  if (files && (files.upperFile || files.lowerFile || files.mouthPhotoFile)) {
    try {
      await uploadFilesToR2(order.id, files);
    } catch (err) {
      // Files failed to upload, but order was created
      console.error('Error uploading files:', err);
      throw new Error(
        'Orden creada pero error al subir archivos. Por favor, añade los archivos desde la vista de detalle.'
      );
    }
  }

  return order;
}

/**
 * Update an existing order
 */
export async function updateOrder(
  role: RoleType,
  orderId: string,
  formData: OrderFormData,
  files?: OrderFiles
): Promise<void> {
  // Step 1: Update order (JSON only, no files)
  const response = await fetch(buildOrderPath(role, orderId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await response.json();
  if (!response.ok) {
    // Preserve validation error details if present
    if (data.details && Array.isArray(data.details)) {
      const error = new Error(data.error || 'Error al actualizar orden') as Error & {
        details: Array<{ path?: string[]; message?: string }>;
        error?: string;
      };
      error.details = data.details;
      error.error = data.error;
      throw error;
    }
    throw new Error(data.error || 'Error al actualizar orden');
  }

  // Step 2: Upload files to R2 if provided
  if (files && (files.upperFile || files.lowerFile || files.mouthPhotoFile)) {
    try {
      await uploadFilesToR2(orderId, files);
    } catch (err) {
      // Files failed to upload, but order was updated
      console.error('Error uploading files:', err);
      throw new Error(
        'Orden actualizada pero error al subir archivos. Por favor, añade los archivos desde la vista de detalle.'
      );
    }
  }
}

/**
 * Submit an order for review
 */
export async function submitOrderForReview(role: RoleType, orderId: string): Promise<void> {
  const response = await fetch(buildOrderSubmitPath(role, orderId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al enviar orden');
  }
}

/**
 * Handle successful order save navigation
 */
export function handleSuccessNavigation(
  onSuccess: (() => void) | undefined,
  router: { push: (path: string) => void; refresh: () => void },
  role: RoleType
): void {
  if (onSuccess) {
    onSuccess();
  } else {
    router.push(`/${role}/orders`);
    router.refresh();
  }
}
