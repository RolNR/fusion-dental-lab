'use client';

import { FileUpload } from '@/components/ui/FileUpload';
import { FileCategory } from '@/types/file';
import { SectionContainer, SectionHeader } from '@/components/ui/form';

type MouthPhotosSectionProps = {
  value?: File | null;
  onChange: (file: File | null) => void;
  orderId?: string;
  onUploadComplete?: (fileId: string) => void;
};

export function MouthPhotosSection({
  value,
  onChange,
  orderId,
  onUploadComplete,
}: MouthPhotosSectionProps) {
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
          value={value || null}
          onChange={onChange}
          category={FileCategory.MOUTH_PHOTO}
          orderId={orderId}
          onUploadComplete={onUploadComplete}
        />
      </div>
    </SectionContainer>
  );
}
