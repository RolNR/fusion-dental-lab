'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { FileUpload } from '@/components/ui/FileUpload';
import { Icons } from '@/components/ui/Icons';
import {
  FileCategory,
  FILE_CATEGORY_LABELS,
  ALLOWED_SCAN_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_OTHER_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_IMAGE_SIZE_MB,
  MAX_OTHER_SIZE_MB,
  MAX_FILES_PER_CATEGORY,
} from '@/types/file';

interface FileData {
  id: string;
  category: string;
}

interface UploadModalProps {
  orderId: string;
  onClose: () => void;
}

export function UploadModal({ orderId, onClose }: UploadModalProps) {
  const [category, setCategory] = useState<FileCategory>(FileCategory.SCAN_UPPER);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileData[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [uploadedCount, setUploadedCount] = useState(0);

  // Fetch existing files to check category limits
  useEffect(() => {
    fetchExistingFiles();
  }, [orderId]);

  const fetchExistingFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const response = await fetch(`/api/orders/${orderId}/files`);

      if (!response.ok) {
        throw new Error('Error al cargar archivos existentes');
      }

      const data = await response.json();
      setExistingFiles(data.files || []);
    } catch (err) {
      console.error('Error fetching existing files:', err);
      setExistingFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleUploadComplete = (fileId: string) => {
    setUploadedCount((prev) => prev + 1);

    // If all files uploaded, close modal and refresh
    if (uploadedCount + 1 >= files.length) {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const getAcceptTypes = (cat: FileCategory): string => {
    if (cat === FileCategory.PHOTOGRAPH) {
      return ALLOWED_IMAGE_TYPES.join(',');
    }
    if (cat === FileCategory.SCAN_UPPER || cat === FileCategory.SCAN_LOWER) {
      return ALLOWED_SCAN_TYPES.join(',');
    }
    return [...ALLOWED_SCAN_TYPES, ...ALLOWED_IMAGE_TYPES, ...ALLOWED_OTHER_TYPES].join(',');
  };

  const getMaxSize = (cat: FileCategory): number => {
    if (cat === FileCategory.PHOTOGRAPH) {
      return MAX_IMAGE_SIZE_MB;
    }
    if (cat === FileCategory.SCAN_UPPER || cat === FileCategory.SCAN_LOWER) {
      return MAX_FILE_SIZE_MB;
    }
    return MAX_OTHER_SIZE_MB;
  };

  const getCategoryFileCount = (cat: FileCategory): number => {
    return existingFiles.filter((f) => f.category === cat).length;
  };

  const getRemainingSlots = (cat: FileCategory): number => {
    return MAX_FILES_PER_CATEGORY - getCategoryFileCount(cat);
  };

  const canUploadToCategory = (cat: FileCategory): boolean => {
    return getRemainingSlots(cat) > 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 rounded-lg border border-border bg-background p-6 shadow-lg">
        {/* Close button */}
        <Button variant="ghost" size="sm" onClick={onClose} className="absolute top-4 right-4">
          <Icons.x className="h-4 w-4" />
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Añadir Archivos</h2>
          <p className="text-sm text-muted-foreground mt-1">Máximo 3 archivos por categoría</p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isLoadingFiles ? (
            <div className="flex items-center justify-center py-8">
              <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Select
                label="Categoría"
                required
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as FileCategory);
                  setFiles([]); // Reset files when category changes
                  setUploadedCount(0);
                }}
              >
                {Object.entries(FILE_CATEGORY_LABELS).map(([value, label]) => {
                  const cat = value as FileCategory;
                  const remaining = getRemainingSlots(cat);
                  const count = getCategoryFileCount(cat);

                  return (
                    <option key={value} value={value} disabled={remaining === 0}>
                      {label} ({count}/{MAX_FILES_PER_CATEGORY})
                      {remaining === 0 ? ' - Completo' : ''}
                    </option>
                  );
                })}
              </Select>

              {/* Category limit warning */}
              {!canUploadToCategory(category) ? (
                <div className="rounded-md bg-warning/10 p-4">
                  <div className="flex items-start">
                    <Icons.alertCircle className="h-5 w-5 text-warning mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-warning">Límite alcanzado</p>
                      <p className="text-sm text-warning/80 mt-1">
                        Ya has subido el máximo de {MAX_FILES_PER_CATEGORY} archivos para esta
                        categoría. Elimina algunos archivos existentes para subir nuevos.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Upload info */}
                  <div className="rounded-md bg-primary/10 p-3">
                    <p className="text-sm text-primary">
                      <Icons.info className="inline h-4 w-4 mr-1" />
                      Puedes subir {getRemainingSlots(category)} archivo(s) más en esta categoría
                    </p>
                  </div>

                  {/* File upload - supports multiple selection */}
                  <FileUpload
                    label={`Archivos (máx. ${getRemainingSlots(category)})`}
                    accept={getAcceptTypes(category)}
                    maxSize={getMaxSize(category)}
                    value={files[0] || null}
                    onChange={(file) => {
                      if (file) {
                        setFiles([file]);
                      } else {
                        setFiles([]);
                      }
                    }}
                    required
                    category={category}
                    orderId={orderId}
                    onUploadComplete={handleUploadComplete}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            {uploadedCount > 0 ? 'Cerrar' : 'Cancelar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
