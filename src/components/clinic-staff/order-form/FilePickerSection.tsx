'use client';

import { useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

interface FilePickerSectionProps {
  title: string;
  description: string;
  acceptedTypes: string;
  maxFiles: number;
  maxSizeMB: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  icon?: 'upload' | 'camera';
}

interface FileError {
  fileName: string;
  error: string;
}

export function FilePickerSection({
  title,
  description,
  acceptedTypes,
  maxFiles,
  maxSizeMB,
  files,
  onFilesChange,
  icon = 'upload',
}: FilePickerSectionProps) {
  const [fileErrors, setFileErrors] = useState<FileError[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const remainingSlots = maxFiles - files.length;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const validFiles: File[] = [];
    const errors: FileError[] = [];

    selectedFiles.slice(0, remainingSlots).forEach((file) => {
      if (file.size > maxSizeBytes) {
        errors.push({
          fileName: file.name,
          error: `Tamaño excedido (${(file.size / 1024 / 1024).toFixed(2)} MB de ${maxSizeMB} MB máximo)`,
        });
      } else {
        validFiles.push(file);
      }
    });

    setFileErrors(errors);

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }

    // Clear the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
    // Clear errors when user removes a file
    if (fileErrors.length > 0) {
      setFileErrors([]);
    }
  };

  const IconComponent = icon === 'camera' ? Icons.camera : Icons.upload;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {files.length}/{maxFiles}
        </div>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md bg-muted/50 p-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icons.file className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate text-foreground">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="ml-2 text-danger hover:text-danger/80 shrink-0"
                aria-label="Eliminar archivo"
              >
                <Icons.x className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Validation Errors */}
      {fileErrors.length > 0 && (
        <div className="rounded-md bg-danger/10 border border-danger/30 p-3">
          <div className="flex items-start gap-2">
            <Icons.alertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-danger mb-1">
                {fileErrors.length === 1
                  ? 'Archivo rechazado'
                  : `${fileErrors.length} archivos rechazados`}
              </p>
              <ul className="space-y-1">
                {fileErrors.map((error, index) => (
                  <li key={index} className="text-xs text-danger/90">
                    <span className="font-medium">{error.fileName}:</span> {error.error}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-danger/80 mt-2">
                Tamaño máximo permitido: {maxSizeMB} MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Files Button */}
      {files.length < maxFiles && (
        <div>
          <input
            type="file"
            id={`file-input-${title}`}
            accept={acceptedTypes}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor={`file-input-${title}`}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById(`file-input-${title}`)?.click()}
              className="w-full"
            >
              <IconComponent className="h-4 w-4 mr-2" />
              {files.length === 0 ? 'Seleccionar Archivos' : 'Añadir Más Archivos'}
            </Button>
          </label>
        </div>
      )}

      {files.length >= maxFiles && (
        <p className="text-xs text-warning">Límite de {maxFiles} archivos alcanzado</p>
      )}
    </div>
  );
}
