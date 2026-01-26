'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ScanPreview } from '@/components/ui/ScanPreview';
import Image from 'next/image';

interface FilePreviewModalProps {
  file: {
    id: string;
    originalName: string;
    storageUrl: string;
    thumbnailUrl?: string;
    mimeType: string;
    category: string;
  };
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const isImage = file.mimeType.startsWith('image/');
  const is3DModel =
    file.mimeType.includes('stl') ||
    file.mimeType.includes('ply') ||
    file.category.includes('scan');

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-6xl overflow-auto rounded-lg bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground truncate pr-4">
            {file.originalName}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="!h-8 !w-8 !p-0 !rounded-lg hover:!bg-muted"
            aria-label="Cerrar"
          >
            <Icons.x className="h-5 w-5 text-foreground" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isImage ? (
            // Image Preview
            <div className="flex items-center justify-center">
              <div className="relative max-h-[70vh] w-full">
                <Image
                  src={file.storageUrl}
                  alt={file.originalName}
                  width={1200}
                  height={800}
                  className="h-auto w-full rounded-lg object-contain"
                  style={{ maxHeight: '70vh' }}
                />
              </div>
            </div>
          ) : is3DModel ? (
            // 3D Model Preview - Load from URL
            <div className="h-[70vh]">
              <ScanPreview url={file.storageUrl} onClose={() => {}} />
            </div>
          ) : (
            // Unsupported file type
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Icons.file className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Vista previa no disponible para este tipo de archivo
              </p>
              <a
                href={file.storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                <Icons.download className="h-4 w-4" />
                Descargar archivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
