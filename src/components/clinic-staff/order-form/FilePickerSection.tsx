'use client';

import { useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { ScanPreview } from '@/components/ui/ScanPreview';
import { Inline3DPreview } from './Inline3DPreview';
import { InlineImagePreview } from './InlineImagePreview';

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
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [showInlinePreview, setShowInlinePreview] = useState(true);
  const [showInlineImagePreview, setShowInlineImagePreview] = useState(true);

  const is3DFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension === 'stl' || extension === 'ply';
  };

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/');
  };

  // Get all 3D files
  const all3DFiles = files.filter(is3DFile);
  const has3DFiles = all3DFiles.length > 0;

  // Get all image files
  const allImageFiles = files.filter(isImageFile);
  const hasImageFiles = allImageFiles.length > 0;

  // Track which file is being previewed inline (default to first)
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const selectedPreviewFile = all3DFiles[selectedPreviewIndex] || null;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImageFile = allImageFiles[selectedImageIndex] || null;

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
          {files.map((file, index) => {
            const is3D = is3DFile(file);
            const isImage = file.type.startsWith('image/');

            return (
              <div
                key={index}
                className="flex items-start gap-3 rounded-md bg-muted/50 p-3 text-sm"
              >
                {/* Thumbnail/Icon */}
                {is3D || isImage ? (
                  <div
                    className="group relative h-12 w-12 cursor-pointer overflow-hidden rounded-md border border-border bg-muted flex-shrink-0"
                    onClick={() => {
                      if (is3D) {
                        setPreviewFile(file);
                      } else if (isImage) {
                        // Find the index of this image in allImageFiles
                        const imageIndex = allImageFiles.indexOf(file);
                        if (imageIndex !== -1) {
                          setSelectedImageIndex(imageIndex);
                          setShowInlineImagePreview(true);
                        }
                      }
                    }}
                  >
                    {isImage ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Icons.cube className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    {/* Eye icon overlay on hover */}
                    {(is3D || isImage) && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/50">
                        <Icons.eye className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                    <Icons.file className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-foreground font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {(is3D || isImage) && (
                          <span className="ml-2 inline-flex items-center gap-1 text-primary">
                            <Icons.eye className="h-3 w-3" />
                            Vista previa disponible
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {(is3D || isImage) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (is3D) {
                              setPreviewFile(file);
                            } else if (isImage) {
                              const imageIndex = allImageFiles.indexOf(file);
                              if (imageIndex !== -1) {
                                setSelectedImageIndex(imageIndex);
                                setShowInlineImagePreview(true);
                              }
                            }
                          }}
                          className="text-primary hover:text-primary/80 p-1.5 h-auto"
                          aria-label="Ver vista previa"
                          title={is3D ? "Ver vista previa 3D" : "Ver fotografía"}
                        >
                          <Icons.eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="text-danger hover:text-danger/80 p-1.5 h-auto"
                        aria-label="Eliminar archivo"
                      >
                        <Icons.x className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline 3D Preview */}
      {selectedPreviewFile && showInlinePreview && (
        <Inline3DPreview
          selectedFile={selectedPreviewFile}
          allFiles={all3DFiles}
          selectedIndex={selectedPreviewIndex}
          onIndexChange={setSelectedPreviewIndex}
          onClose={() => setShowInlinePreview(false)}
        />
      )}

      {/* Show Preview Button (if hidden) */}
      {has3DFiles && !showInlinePreview && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowInlinePreview(true)}
          className="w-full"
        >
          <Icons.eye className="h-4 w-4 mr-2" />
          Mostrar Vista Previa 3D
          {all3DFiles.length > 1 && (
            <span className="ml-2 text-xs text-muted-foreground">({all3DFiles.length} archivos)</span>
          )}
        </Button>
      )}

      {/* Inline Image Preview */}
      {selectedImageFile && showInlineImagePreview && (
        <InlineImagePreview
          selectedFile={selectedImageFile}
          allFiles={allImageFiles}
          selectedIndex={selectedImageIndex}
          onIndexChange={setSelectedImageIndex}
          onClose={() => setShowInlineImagePreview(false)}
        />
      )}

      {/* Show Image Preview Button (if hidden) */}
      {hasImageFiles && !showInlineImagePreview && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowInlineImagePreview(true)}
          className="w-full"
        >
          <Icons.eye className="h-4 w-4 mr-2" />
          Mostrar Vista Previa de Fotografías
          {allImageFiles.length > 1 && (
            <span className="ml-2 text-xs text-muted-foreground">({allImageFiles.length} fotografías)</span>
          )}
        </Button>
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

      {/* 3D Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-6xl overflow-auto rounded-lg bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground truncate pr-4">
                {previewFile.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewFile(null)}
                className="h-8 w-8 p-0"
                aria-label="Cerrar"
              >
                <Icons.x className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="h-[70vh]">
                <ScanPreview file={previewFile} onClose={() => setPreviewFile(null)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
