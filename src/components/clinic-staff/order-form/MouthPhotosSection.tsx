'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import { FileCategory } from '@/types/file';
import {
  SectionContainer,
  SectionHeader,
} from '@/components/ui/form';

type MouthPhotosSectionProps = {
  orderId?: string;
  onUploadComplete?: (fileId: string) => void;
};

export function MouthPhotosSection({
  orderId,
  onUploadComplete,
}: MouthPhotosSectionProps) {
  const [mouthPhotoFile, setMouthPhotoFile] = useState<File | null>(null);

  return (
    <SectionContainer>
      <SectionHeader
        icon="eye"
        title="Fotos Intraorales"
        description="Imágenes de referencia del caso (opcional)"
      />

      <div className="p-6">
        <FileUpload
          label="Foto Intraoral"
          accept=".jpg,.jpeg,.png,.webp"
          maxSize={10}
          value={mouthPhotoFile}
          onChange={setMouthPhotoFile}
          category={FileCategory.MOUTH_PHOTO}
          orderId={orderId}
          onUploadComplete={onUploadComplete}
        />
      </div>
    </SectionContainer>
  );
}
