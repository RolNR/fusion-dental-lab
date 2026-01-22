'use client';

import { Icons } from '@/components/ui/Icons';

interface FileUploadProgressModalProps {
  uploadedCount: number;
  totalCount: number;
  currentFileName: string;
  overallProgress: number; // 0-100
}

export function FileUploadProgressModal({
  uploadedCount,
  totalCount,
  currentFileName,
  overallProgress,
}: FileUploadProgressModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-background shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Subiendo Archivos</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Por favor espera mientras se suben los archivos...
          </p>
        </div>

        {/* Progress Info */}
        <div className="space-y-4">
          {/* File Counter */}
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              Archivo {uploadedCount + 1} de {totalCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{currentFileName}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(overallProgress)}%
            </p>
          </div>

          {/* Status Message */}
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <Icons.alertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                No cierres esta ventana mientras se están subiendo los archivos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
