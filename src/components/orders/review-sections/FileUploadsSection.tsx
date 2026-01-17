import { SectionTitle } from './ReviewSectionComponents';
import { FileUpload } from '@/components/ui/FileUpload';
import { OcclusionPreview } from '@/components/ui/OcclusionPreview';
import { FileCategory } from '@/types/file';
import { ScanType } from '@prisma/client';

interface FileUploadsSectionProps {
  scanType?: ScanType | null;
  upperFile?: File | null;
  lowerFile?: File | null;
  mouthPhotoFile?: File | null;
  onUpperFileChange?: (file: File | null) => void;
  onLowerFileChange?: (file: File | null) => void;
  onMouthPhotoFileChange?: (file: File | null) => void;
  orderId?: string;
}

export function FileUploadsSection({
  scanType,
  upperFile,
  lowerFile,
  mouthPhotoFile,
  onUpperFileChange,
  onLowerFileChange,
  onMouthPhotoFileChange,
  orderId,
}: FileUploadsSectionProps) {
  // Only show if digital scan is selected
  const showDigitalScanUploads = scanType === ScanType.DIGITAL_SCAN;

  // Don't render section if no uploads are available
  if (!showDigitalScanUploads && !onMouthPhotoFileChange) {
    return null;
  }

  return (
    <>
      <SectionTitle>Archivos</SectionTitle>

      <div className="space-y-4">
        {/* Digital Scan Files */}
        {showDigitalScanUploads && (
          <div className="rounded-lg bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-semibold text-foreground">
                Archivos de Escaneo Digital (STL/PLY)
              </p>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                Requerido
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {onUpperFileChange && (
                <FileUpload
                  label="Arcada Superior"
                  accept=".stl,.ply"
                  maxSize={50}
                  value={upperFile || null}
                  onChange={onUpperFileChange}
                  category={FileCategory.SCAN_UPPER}
                  orderId={orderId}
                  required
                />
              )}

              {onLowerFileChange && (
                <FileUpload
                  label="Arcada Inferior"
                  accept=".stl,.ply"
                  maxSize={50}
                  value={lowerFile || null}
                  onChange={onLowerFileChange}
                  category={FileCategory.SCAN_LOWER}
                  orderId={orderId}
                  required
                />
              )}
            </div>

            {/* Occlusion Preview - Show when any file is uploaded */}
            {(upperFile || lowerFile) && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-foreground mb-3">
                  {upperFile && lowerFile ? 'Vista de Oclusión' : upperFile ? 'Vista Previa - Arcada Superior' : 'Vista Previa - Arcada Inferior'}
                </p>
                <OcclusionPreview
                  upperFile={upperFile}
                  lowerFile={lowerFile}
                />
              </div>
            )}
          </div>
        )}

        {/* Mouth Photos */}
        {onMouthPhotoFileChange && (
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground mb-3">
              Fotos Intraorales (Opcional)
            </p>

            <FileUpload
              label="Foto Intraoral"
              accept=".jpg,.jpeg,.png,.webp"
              maxSize={10}
              value={mouthPhotoFile || null}
              onChange={onMouthPhotoFileChange}
              category={FileCategory.MOUTH_PHOTO}
              orderId={orderId}
            />
          </div>
        )}
      </div>
    </>
  );
}
