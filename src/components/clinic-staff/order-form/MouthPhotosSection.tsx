'use client';

import { SectionContainer, SectionHeader } from '@/components/ui/form';
import { FilePickerSection } from './FilePickerSection';
import { ALLOWED_IMAGE_TYPES, MAX_FILES_PER_CATEGORY, MAX_IMAGE_SIZE_MB } from '@/types/file';

interface MouthPhotosSectionProps {
  photographFiles?: File[];
  onPhotographFilesChange?: (files: File[]) => void;
}

export function MouthPhotosSection({
  photographFiles = [],
  onPhotographFilesChange,
}: MouthPhotosSectionProps) {
  return (
    <SectionContainer>
      <SectionHeader
        icon="eye"
        title="Fotos Intraorales"
        description="Imágenes de referencia del caso"
      />

      <div className="p-6">
        {onPhotographFilesChange ? (
          <FilePickerSection
            title="Fotografías Intraorales"
            description="Sube fotografías del caso (máx. 3)"
            acceptedTypes={ALLOWED_IMAGE_TYPES.join(',')}
            maxFiles={MAX_FILES_PER_CATEGORY}
            maxSizeMB={MAX_IMAGE_SIZE_MB}
            files={photographFiles}
            onFilesChange={onPhotographFilesChange}
            icon="camera"
          />
        ) : (
          <div className="rounded-lg bg-primary/10 p-4">
            <p className="text-sm text-primary">
              <strong>Nota:</strong> Las fotografías intraorales se pueden subir después de crear la
              orden usando el botón &quot;Añadir Archivos&quot;. Puedes subir hasta 3 fotografías por
              orden.
            </p>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
