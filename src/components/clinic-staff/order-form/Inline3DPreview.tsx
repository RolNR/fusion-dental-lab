'use client';

import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { ScanPreview } from '@/components/ui/ScanPreview';

interface Inline3DPreviewProps {
  selectedFile: File;
  allFiles: File[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function Inline3DPreview({
  selectedFile,
  allFiles,
  selectedIndex,
  onIndexChange,
  onClose,
}: Inline3DPreviewProps) {
  const hasMultipleFiles = allFiles.length > 1;

  return (
    <div className="mt-4 space-y-3 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icons.cube className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-foreground">Vista Previa 3D</h4>
            <p className="text-xs text-primary font-medium truncate">{selectedFile.name}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <Icons.x className="h-4 w-4 mr-1" />
          Ocultar
        </Button>
      </div>

      {/* File Selector (if multiple 3D files) */}
      {hasMultipleFiles && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onIndexChange(Math.max(0, selectedIndex - 1))}
            disabled={selectedIndex === 0}
            className="h-10 w-10 p-0"
          >
            <Icons.chevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 text-center">
            <p className="text-xs font-medium text-foreground">
              Archivo {selectedIndex + 1} de {allFiles.length}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onIndexChange(Math.min(allFiles.length - 1, selectedIndex + 1))}
            disabled={selectedIndex === allFiles.length - 1}
            className="h-10 w-10 p-0"
          >
            <Icons.chevronRight className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* 3D Preview Canvas */}
      <div className="rounded-lg overflow-hidden border border-border bg-background">
        <ScanPreview file={selectedFile} />
      </div>

      {/* File info */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Icons.file className="h-3 w-3" />
        <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
    </div>
  );
}
