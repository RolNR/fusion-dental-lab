'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { FileUpload } from '@/components/ui/FileUpload';
import { Icons } from '@/components/ui/Icons';
import {
  FileCategory,
  FILE_CATEGORY_LABELS,
  ALLOWED_SCAN_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_IMAGE_SIZE_MB,
} from '@/types/file';

interface UploadModalProps {
  orderId: string;
  onClose: () => void;
}

export function UploadModal({ orderId, onClose }: UploadModalProps) {
  const [category, setCategory] = useState<FileCategory>(FileCategory.OTHER);
  const [file, setFile] = useState<File | null>(null);

  const handleUploadComplete = () => {
    // Close modal and refresh parent
    onClose();
  };

  const getAcceptTypes = (cat: FileCategory): string => {
    if (cat === FileCategory.MOUTH_PHOTO) {
      return ALLOWED_IMAGE_TYPES.join(',');
    }
    return ALLOWED_SCAN_TYPES.join(',');
  };

  const getMaxSize = (cat: FileCategory): number => {
    if (cat === FileCategory.MOUTH_PHOTO) {
      return MAX_IMAGE_SIZE_MB;
    }
    return MAX_FILE_SIZE_MB;
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
          <h2 className="text-xl font-semibold text-foreground">Añadir Archivo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona la categoría y sube el archivo
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <Select
            label="Categoría"
            required
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as FileCategory);
              setFile(null); // Reset file when category changes
            }}
          >
            {Object.entries(FILE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <FileUpload
            label="Archivo"
            accept={getAcceptTypes(category)}
            maxSize={getMaxSize(category)}
            value={file}
            onChange={setFile}
            required
            category={category}
            orderId={orderId}
            onUploadComplete={handleUploadComplete}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
