'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ScanPreview } from '@/components/ui/ScanPreview';
import { formatFileSize } from '@/lib/formatters';
import { FileCategory } from '@/types/file';
import { getFileMimeType } from '@/lib/fileUtils';

type UploadState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  value?: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  error?: string;
  // New props for R2 upload
  category: FileCategory;
  orderId?: string; // If provided, upload immediately
  onUploadComplete?: (fileId: string) => void;
}

export function FileUpload({
  label,
  accept = '.stl,.ply',
  maxSize = 50,
  value,
  onChange,
  required = false,
  error,
  category,
  orderId,
  onUploadComplete,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadToR2 = async (file: File) => {
    if (!orderId) {
      // If no orderId, just set the file locally
      onChange(file);
      return;
    }

    try {
      setUploadState('uploading');
      setUploadProgress(0);

      const mimeType = getFileMimeType(file);

      // Step 1: Request pre-signed URL (0-10%)
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
      setUploadProgress(10);

      // Step 2: Upload to R2 (10-50%)
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

      setUploadProgress(50);
      setUploadState('processing');

      // Step 3: Process upload and save metadata (50-100%)
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

      const { file: uploadedFile } = await processResponse.json();
      setUploadProgress(100);
      setUploadState('complete');
      setUploadedFileId(uploadedFile.id);

      // Clear local file and notify parent
      onChange(null);
      onUploadComplete?.(uploadedFile.id);
    } catch (err) {
      setUploadState('error');
      setValidationError(err instanceof Error ? err.message : 'Error al subir archivo');
      setUploadProgress(0);
    }
  };

  const handleFile = async (file: File) => {
    // Clear previous validation errors
    setValidationError(null);
    setUploadState('idle');
    setUploadProgress(0);

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setValidationError(`El archivo es demasiado grande. Tamaño máximo: ${maxSize}MB`);
      return;
    }

    // Validate file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = accept.split(',').map((ext) => ext.trim().toLowerCase());

    if (!acceptedExtensions.includes(fileExtension)) {
      setValidationError(`Tipo de archivo no válido. Se aceptan: ${accept}`);
      return;
    }

    onChange(file);

    // If orderId provided, upload immediately
    if (orderId) {
      await uploadToR2(file);
    } else {
      setShowPreview(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setValidationError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>

      {/* Upload in progress */}
      {(uploadState === 'uploading' || uploadState === 'processing') && (
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {uploadState === 'uploading' ? 'Subiendo archivo...' : 'Procesando archivo...'}
              </p>
              <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload complete */}
      {uploadState === 'complete' && (
        <div className="rounded-lg border border-success bg-success/10 p-4">
          <div className="flex items-center gap-3">
            <Icons.check className="h-8 w-8 text-success flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-success">Archivo subido correctamente</p>
            </div>
          </div>
        </div>
      )}

      {/* File selection / upload area */}
      {uploadState !== 'uploading' &&
        uploadState !== 'processing' &&
        uploadState !== 'complete' && (
          <>
            {!value ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-lg border-2 border-dashed transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : error || validationError
                      ? 'border-danger bg-danger/5'
                      : 'border-border bg-muted hover:border-primary/50'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={accept}
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required={required}
                  disabled={false}
                />
                <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
                  <Icons.upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Arrastra el archivo aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {accept.toUpperCase()} (Máx. {maxSize}MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <Icons.file className="h-10 w-10 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{value.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(value.size)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        <Icons.eye className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="danger" size="sm" onClick={handleRemove}>
                        <Icons.trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {showPreview && <ScanPreview file={value} onClose={() => setShowPreview(false)} />}
              </div>
            )}
          </>
        )}

      {(error || validationError) && (
        <p className="text-sm text-danger">{error || validationError}</p>
      )}
    </div>
  );
}
