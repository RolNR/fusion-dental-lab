'use client';

import { ScannerType } from '@prisma/client';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CollapsibleSubsection } from '@/components/ui/form';
import { FilePickerSection } from './FilePickerSection';
import { ALLOWED_SCAN_TYPES, MAX_FILES_PER_CATEGORY, MAX_FILE_SIZE_MB } from '@/types/file';

type DigitalScanSectionProps = {
  isDigitalScan?: boolean;
  escanerUtilizado?: ScannerType;
  otroEscaner?: string;
  upperFiles?: File[];
  lowerFiles?: File[];
  biteFiles?: File[];
  onUpperFilesChange?: (files: File[]) => void;
  onLowerFilesChange?: (files: File[]) => void;
  onBiteFilesChange?: (files: File[]) => void;
  onChange: (updates: {
    isDigitalScan?: boolean;
    escanerUtilizado?: ScannerType | null;
    otroEscaner?: string;
  }) => void;
  errors?: {
    escanerUtilizado?: string;
    otroEscaner?: string;
  };
  disabled?: boolean;
};

export function DigitalScanSection({
  isDigitalScan,
  escanerUtilizado,
  otroEscaner,
  upperFiles = [],
  lowerFiles = [],
  biteFiles = [],
  onUpperFilesChange,
  onLowerFilesChange,
  onBiteFilesChange,
  onChange,
  errors,
  disabled = false,
}: DigitalScanSectionProps) {
  const handleToggle = (checked: boolean) => {
    if (checked) {
      onChange({ isDigitalScan: true });
    } else {
      // Clear all fields when unchecking
      onChange({
        isDigitalScan: false,
        escanerUtilizado: null,
        otroEscaner: undefined,
      });
    }
  };

  const handleEscanerChange = (value: string) => {
    const scannerValue = value === '' ? null : (value as ScannerType);
    onChange({ escanerUtilizado: scannerValue ?? undefined });

    // Clear "other scanner" field if not "Otro"
    if (value !== ScannerType.Otro) {
      onChange({ otroEscaner: undefined });
    }
  };

  return (
    <CollapsibleSubsection icon="upload" title="Escaneo Digital">
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <Checkbox
            label="¿Es un escaneo digital?"
            checked={isDigitalScan === true}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={disabled}
          />
          <p className="mt-2 ml-6 text-sm text-muted-foreground">
            Selecciona esta opción si enviarás archivos STL/PLY del escaneo intraoral
          </p>
        </div>

        {/* Conditionally render scanner and file upload fields */}
        {isDigitalScan && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <Select
              label="Escáner Utilizado"
              value={escanerUtilizado || ''}
              onChange={(e) => handleEscanerChange(e.target.value)}
              error={errors?.escanerUtilizado}
              disabled={disabled}
              required
            >
              <option value="">Selecciona un escáner</option>
              <option value={ScannerType.iTero}>iTero</option>
              <option value={ScannerType.Medit}>Medit</option>
              <option value={ScannerType.ThreeShape}>3Shape</option>
              <option value={ScannerType.Carestream}>Carestream</option>
              <option value={ScannerType.Otro}>Otro</option>
            </Select>

            {/* Other Scanner Name */}
            {escanerUtilizado === ScannerType.Otro && (
              <Input
                label="Especifica el Escáner"
                type="text"
                value={otroEscaner || ''}
                onChange={(e) => onChange({ otroEscaner: e.target.value })}
                placeholder="Nombre del escáner..."
                error={errors?.otroEscaner}
                required
                disabled={disabled}
              />
            )}

            {/* File upload - Upper Arch */}
            {onUpperFilesChange && (
              <FilePickerSection
                title="Arcada Superior (STL/PLY)"
                description="Sube los archivos del maxilar superior (máx. 3)"
                acceptedTypes={ALLOWED_SCAN_TYPES.join(',')}
                maxFiles={MAX_FILES_PER_CATEGORY}
                maxSizeMB={MAX_FILE_SIZE_MB}
                files={upperFiles}
                onFilesChange={onUpperFilesChange}
                icon="upload"
              />
            )}

            {/* File upload - Lower Arch */}
            {onLowerFilesChange && (
              <FilePickerSection
                title="Arcada Inferior (STL/PLY)"
                description="Sube los archivos de la mandíbula inferior (máx. 3)"
                acceptedTypes={ALLOWED_SCAN_TYPES.join(',')}
                maxFiles={MAX_FILES_PER_CATEGORY}
                maxSizeMB={MAX_FILE_SIZE_MB}
                files={lowerFiles}
                onFilesChange={onLowerFilesChange}
                icon="upload"
              />
            )}

            {/* File upload - Bite Scan */}
            {onBiteFilesChange && (
              <FilePickerSection
                title="Escaneo de Mordida (STL/PLY)"
                description="Registro de mordida - opcional (máx. 3)"
                acceptedTypes={ALLOWED_SCAN_TYPES.join(',')}
                maxFiles={MAX_FILES_PER_CATEGORY}
                maxSizeMB={MAX_FILE_SIZE_MB}
                files={biteFiles}
                onFilesChange={onBiteFilesChange}
                icon="upload"
              />
            )}
          </div>
        )}
      </div>
    </CollapsibleSubsection>
  );
}
