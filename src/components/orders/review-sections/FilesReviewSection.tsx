'use client';

import { useState } from 'react';
import { SectionTitle } from './ReviewSectionComponents';
import { FilePickerSection } from '@/components/clinic-staff/order-form/FilePickerSection';
import { OcclusionPreview } from '@/components/ui/OcclusionPreview';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import {
  ALLOWED_SCAN_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_OTHER_TYPES,
  MAX_FILES_PER_CATEGORY,
  MAX_FILE_SIZE_MB,
  MAX_IMAGE_SIZE_MB,
  MAX_OTHER_SIZE_MB,
} from '@/types/file';

interface FilesReviewSectionProps {
  upperFiles: File[];
  lowerFiles: File[];
  photographFiles: File[];
  otherFiles: File[];
  onUpperFilesChange: (files: File[]) => void;
  onLowerFilesChange: (files: File[]) => void;
  onPhotographFilesChange: (files: File[]) => void;
  onOtherFilesChange: (files: File[]) => void;
}

export function FilesReviewSection({
  upperFiles,
  lowerFiles,
  photographFiles,
  otherFiles,
  onUpperFilesChange,
  onLowerFilesChange,
  onPhotographFilesChange,
  onOtherFilesChange,
}: FilesReviewSectionProps) {
  const [showOcclusionPreview, setShowOcclusionPreview] = useState(false);
  const totalFiles = upperFiles.length + lowerFiles.length + photographFiles.length + otherFiles.length;

  // Use first file from upper and first from lower for occlusion preview
  const hasOcclusionFiles = upperFiles.length > 0 && lowerFiles.length > 0;
  const upperFile = upperFiles[0] || null;
  const lowerFile = lowerFiles[0] || null;

  if (totalFiles === 0) {
    return (
      <>
        <SectionTitle>Archivos Adjuntos</SectionTitle>
        <div className="rounded-lg bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            No hay archivos seleccionados. Puedes añadir archivos a continuación.
          </p>
        </div>
        <div className="mt-4 space-y-4">
          <FilePickerSection
            title="Arcada Superior (STL/PLY)"
            description="Archivos del maxilar superior"
            acceptedTypes={ALLOWED_SCAN_TYPES.join(',')}
            maxFiles={MAX_FILES_PER_CATEGORY}
            maxSizeMB={MAX_FILE_SIZE_MB}
            files={upperFiles}
            onFilesChange={onUpperFilesChange}
            icon="upload"
          />
          <FilePickerSection
            title="Arcada Inferior (STL/PLY)"
            description="Archivos de la mandíbula inferior"
            acceptedTypes={ALLOWED_SCAN_TYPES.join(',')}
            maxFiles={MAX_FILES_PER_CATEGORY}
            maxSizeMB={MAX_FILE_SIZE_MB}
            files={lowerFiles}
            onFilesChange={onLowerFilesChange}
            icon="upload"
          />
          <FilePickerSection
            title="Fotografías"
            description="Fotografías intraorales"
            acceptedTypes={ALLOWED_IMAGE_TYPES.join(',')}
            maxFiles={MAX_FILES_PER_CATEGORY}
            maxSizeMB={MAX_IMAGE_SIZE_MB}
            files={photographFiles}
            onFilesChange={onPhotographFilesChange}
            icon="camera"
          />
          <FilePickerSection
            title="Otros Archivos"
            description="PDFs, documentos, etc."
            acceptedTypes={[...ALLOWED_SCAN_TYPES, ...ALLOWED_IMAGE_TYPES, ...ALLOWED_OTHER_TYPES].join(',')}
            maxFiles={MAX_FILES_PER_CATEGORY}
            maxSizeMB={MAX_OTHER_SIZE_MB}
            files={otherFiles}
            onFilesChange={onOtherFilesChange}
            icon="upload"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SectionTitle>Archivos Adjuntos ({totalFiles})</SectionTitle>
      <div className="space-y-4">
        <FilePickerSection
          title="Arcada Superior (STL/PLY)"
          description="Archivos del maxilar superior"
          acceptedTypes={ALLOWED_SCAN_TYPES.join(',')}
          maxFiles={MAX_FILES_PER_CATEGORY}
          maxSizeMB={MAX_FILE_SIZE_MB}
          files={upperFiles}
          onFilesChange={onUpperFilesChange}
          icon="upload"
        />

        <FilePickerSection
          title="Arcada Inferior (STL/PLY)"
          description="Archivos de la mandíbula inferior"
          acceptedTypes={ALLOWED_SCAN_TYPES.join(',')}
          maxFiles={MAX_FILES_PER_CATEGORY}
          maxSizeMB={MAX_FILE_SIZE_MB}
          files={lowerFiles}
          onFilesChange={onLowerFilesChange}
          icon="upload"
        />

        {/* Occlusion Preview Button (show if we have both upper and lower files) */}
        {hasOcclusionFiles && !showOcclusionPreview && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowOcclusionPreview(true)}
            className="w-full"
          >
            <Icons.eye className="h-4 w-4 mr-2" />
            Ver Vista de Oclusión
          </Button>
        )}

        {/* Occlusion Preview */}
        {showOcclusionPreview && hasOcclusionFiles && (
          <div className="mt-4">
            <OcclusionPreview
              upperFile={upperFile}
              lowerFile={lowerFile}
              onClose={() => setShowOcclusionPreview(false)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Superior: {upperFile?.name} | Inferior: {lowerFile?.name}
            </p>
          </div>
        )}

        <FilePickerSection
          title="Fotografías"
          description="Fotografías intraorales"
          acceptedTypes={ALLOWED_IMAGE_TYPES.join(',')}
          maxFiles={MAX_FILES_PER_CATEGORY}
          maxSizeMB={MAX_IMAGE_SIZE_MB}
          files={photographFiles}
          onFilesChange={onPhotographFilesChange}
          icon="camera"
        />
        <FilePickerSection
          title="Otros Archivos"
          description="PDFs, documentos, etc."
          acceptedTypes={[...ALLOWED_SCAN_TYPES, ...ALLOWED_IMAGE_TYPES, ...ALLOWED_OTHER_TYPES].join(',')}
          maxFiles={MAX_FILES_PER_CATEGORY}
          maxSizeMB={MAX_OTHER_SIZE_MB}
          files={otherFiles}
          onFilesChange={onOtherFilesChange}
          icon="upload"
        />
      </div>
    </>
  );
}
