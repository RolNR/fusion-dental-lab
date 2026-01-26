'use client';

import { CollapsibleSubsection } from '@/components/ui/form';
import { FilePickerSection } from './FilePickerSection';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '@/types/file';

const MAX_PHOTO_FILES = 5;

interface MouthPhotosSectionProps {
  photographFiles?: File[];
  onPhotographFilesChange?: (files: File[]) => void;
}

export function MouthPhotosSection({
  photographFiles = [],
  onPhotographFilesChange,
}: MouthPhotosSectionProps) {
  return (
    <CollapsibleSubsection icon="eye" title="Fotos Intraorales">
      {onPhotographFilesChange ? (
        <FilePickerSection
          title="Fotografías Intraorales"
          description="Sube fotografías del caso (máx. 5)"
          acceptedTypes={ALLOWED_IMAGE_TYPES.join(',')}
          maxFiles={MAX_PHOTO_FILES}
          maxSizeMB={MAX_IMAGE_SIZE_MB}
          files={photographFiles}
          onFilesChange={onPhotographFilesChange}
          icon="camera"
        />
      ) : (
        <div className="rounded-lg bg-primary/10 p-4">
          <p className="text-sm text-primary">
            <strong>Nota:</strong> Las fotografías intraorales se pueden subir después de crear la
            orden usando el botón &quot;Añadir Archivos&quot;. Puedes subir hasta 5 fotografías por
            orden.
          </p>
        </div>
      )}
    </CollapsibleSubsection>
  );
}
