'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ScanPreview } from '@/components/ui/ScanPreview';
import { formatFileSize } from '@/lib/formatters';

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  value?: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  error?: string;
}

export function FileUpload({
  label,
  accept = '.stl,.ply',
  maxSize = 50,
  value,
  onChange,
  required = false,
  error,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Clear previous validation errors
    setValidationError(null);

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setValidationError(`El archivo es demasiado grande. Tamaño máximo: ${maxSize}MB`);
      return;
    }

    // Validate file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());

    if (!acceptedExtensions.includes(fileExtension)) {
      setValidationError(`Tipo de archivo no válido. Se aceptan: ${accept}`);
      return;
    }

    onChange(file);
    setShowPreview(true); // Show preview by default when file is uploaded
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
                <p className="text-sm font-medium text-foreground truncate">
                  {value.name}
                </p>
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
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleRemove}
                >
                  <Icons.trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {showPreview && (
            <ScanPreview file={value} onClose={() => setShowPreview(false)} />
          )}
        </div>
      )}

      {(error || validationError) && (
        <p className="text-sm text-danger">{error || validationError}</p>
      )}
    </div>
  );
}
