'use client';

import { useState, useCallback } from 'react';
import { ScannerType } from '@prisma/client';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { CollapsibleSubsection } from '@/components/ui/form';
import { FilePickerSection, DraggedFileData } from './FilePickerSection';
import {
  ALLOWED_SCAN_TYPES,
  MAX_FILES_PER_CATEGORY,
  MAX_FILE_SIZE_MB,
  ScanCategory,
  SCAN_CATEGORY_LABELS,
  detectScanCategoryFromFilename,
} from '@/types/file';

// Unified Drop Zone Component
interface UnifiedDropZoneProps {
  onFilesDrop: (files: File[]) => void;
  acceptedTypes: string[];
  maxSizeMB: number;
  disabled?: boolean;
}

function UnifiedDropZone({
  onFilesDrop,
  acceptedTypes,
  maxSizeMB,
  disabled,
}: UnifiedDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];
      const newErrors: string[] = [];

      droppedFiles.forEach((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(ext)) {
          newErrors.push(`${file.name}: Tipo no permitido (${acceptedTypes.join(', ')})`);
        } else if (file.size > maxSizeBytes) {
          newErrors.push(`${file.name}: Excede ${maxSizeMB}MB`);
        } else {
          validFiles.push(file);
        }
      });

      setErrors(newErrors);
      if (validFiles.length > 0) {
        onFilesDrop(validFiles);
      }
    },
    [disabled, acceptedTypes, maxSizeMB, onFilesDrop]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length === 0) return;

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];
      const newErrors: string[] = [];

      selectedFiles.forEach((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(ext)) {
          newErrors.push(`${file.name}: Tipo no permitido`);
        } else if (file.size > maxSizeBytes) {
          newErrors.push(`${file.name}: Excede ${maxSizeMB}MB`);
        } else {
          validFiles.push(file);
        }
      });

      setErrors(newErrors);
      if (validFiles.length > 0) {
        onFilesDrop(validFiles);
      }
      e.target.value = '';
    },
    [acceptedTypes, maxSizeMB, onFilesDrop]
  );

  const inputId = 'unified-scan-upload';

  return (
    <div className="space-y-2">
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/10'
            : 'border-border bg-muted/30 hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById(inputId)?.click()}
      >
        <input
          type="file"
          id={inputId}
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        <Icons.upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">Arrastra tus archivos STL/PLY aquí</p>
        <p className="text-xs text-muted-foreground mt-1">
          o haz clic para seleccionar • Se organizarán automáticamente por nombre
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <span className="font-medium">Patrones reconocidos:</span> _upper, _lower, _bite, _sup,
          _inf, _mordida
        </p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md bg-danger/10 border border-danger/30 p-3">
          <div className="flex items-start gap-2">
            <Icons.alertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
            <div className="text-xs text-danger space-y-1">
              {errors.map((error, i) => (
                <p key={i}>{error}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

// Mismatch confirmation state
interface MismatchConfirmation {
  file: File;
  detectedCategory: ScanCategory;
  targetCategory: ScanCategory;
  pendingFiles: File[];
}

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
  const [mismatchConfirmation, setMismatchConfirmation] = useState<MismatchConfirmation | null>(
    null
  );

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

  // Get files and setter for a category
  const getFilesForCategory = useCallback(
    (category: ScanCategory): File[] => {
      switch (category) {
        case 'upper':
          return upperFiles;
        case 'lower':
          return lowerFiles;
        case 'bite':
          return biteFiles;
      }
    },
    [upperFiles, lowerFiles, biteFiles]
  );

  const getSetterForCategory = useCallback(
    (category: ScanCategory): ((files: File[]) => void) | undefined => {
      switch (category) {
        case 'upper':
          return onUpperFilesChange;
        case 'lower':
          return onLowerFilesChange;
        case 'bite':
          return onBiteFilesChange;
      }
    },
    [onUpperFilesChange, onLowerFilesChange, onBiteFilesChange]
  );

  // Add files to a category
  const addFilesToCategory = useCallback(
    (files: File[], category: ScanCategory) => {
      const setter = getSetterForCategory(category);
      const currentFiles = getFilesForCategory(category);
      if (!setter) return;

      const remainingSlots = MAX_FILES_PER_CATEGORY - currentFiles.length;
      const filesToAdd = files.slice(0, remainingSlots);

      if (filesToAdd.length > 0) {
        setter([...currentFiles, ...filesToAdd]);
      }
    },
    [getFilesForCategory, getSetterForCategory]
  );

  // Handle mismatch confirmation response
  const handleMismatchConfirm = useCallback(
    (addToTarget: boolean) => {
      if (!mismatchConfirmation) return;

      const { file, detectedCategory, targetCategory } = mismatchConfirmation;

      if (addToTarget) {
        // User confirmed: add to the target category despite mismatch
        addFilesToCategory([file], targetCategory);
      } else {
        // User cancelled: add to the detected (correct) category
        addFilesToCategory([file], detectedCategory);
      }

      setMismatchConfirmation(null);
    },
    [mismatchConfirmation, addFilesToCategory]
  );

  // Remove file from a category
  const removeFileFromCategory = useCallback(
    (category: ScanCategory, fileIndex: number) => {
      const setter = getSetterForCategory(category);
      const currentFiles = getFilesForCategory(category);
      if (!setter) return;

      setter(currentFiles.filter((_, i) => i !== fileIndex));
    },
    [getFilesForCategory, getSetterForCategory]
  );

  // Handle when a file drag starts (currently just for tracking, can be extended)
  const handleFileDragStart = useCallback((_draggedData: DraggedFileData) => {
    // Drag started - the drop handler will receive the data via dataTransfer
  }, []);

  // Handle inter-zone file drop
  const handleInterZoneDrop = useCallback(
    (draggedData: DraggedFileData, targetCategory: ScanCategory) => {
      const { file, sourceCategory, fileIndex } = draggedData;

      // Check for mismatch
      const detectedCategory = detectScanCategoryFromFilename(file.name);

      if (detectedCategory && detectedCategory !== targetCategory) {
        // Show mismatch confirmation
        setMismatchConfirmation({
          file,
          detectedCategory,
          targetCategory,
          pendingFiles: [],
        });
        // Remove from source immediately (will be added to target or detected on confirm)
        removeFileFromCategory(sourceCategory, fileIndex);
      } else {
        // No mismatch or no detected category - move directly
        removeFileFromCategory(sourceCategory, fileIndex);
        addFilesToCategory([file], targetCategory);
      }
    },
    [addFilesToCategory, removeFileFromCategory]
  );

  // Handle unified drop zone - auto-categorize all files, default to 'upper'
  const handleUnifiedDrop = useCallback(
    (droppedFiles: File[]) => {
      for (const file of droppedFiles) {
        const detectedCategory = detectScanCategoryFromFilename(file.name);
        // Default to 'upper' if no pattern matches
        const targetCategory = detectedCategory || 'upper';
        addFilesToCategory([file], targetCategory);
      }
    },
    [addFilesToCategory]
  );

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

            {/* Unified Drop Zone */}
            <UnifiedDropZone
              onFilesDrop={handleUnifiedDrop}
              acceptedTypes={ALLOWED_SCAN_TYPES}
              maxSizeMB={MAX_FILE_SIZE_MB}
              disabled={disabled}
            />

            {/* File Sections - Display only with inter-zone drag */}
            {(upperFiles.length > 0 || lowerFiles.length > 0 || biteFiles.length > 0) && (
              <div className="space-y-3">
                {/* Upper Arch */}
                {onUpperFilesChange && (
                  <FilePickerSection
                    title="Arcada Superior (STL/PLY)"
                    description="Arrastra archivos entre secciones para reorganizar"
                    acceptedTypes={ALLOWED_SCAN_TYPES.join(',')}
                    maxFiles={MAX_FILES_PER_CATEGORY}
                    maxSizeMB={MAX_FILE_SIZE_MB}
                    files={upperFiles}
                    onFilesChange={onUpperFilesChange}
                    icon="upload"
                    category="upper"
                    onInterZoneDrop={handleInterZoneDrop}
                    onFileDragStart={handleFileDragStart}
                    enableInterZoneDrag
                    hideAddButton
                  />
                )}

                {/* Lower Arch */}
                {onLowerFilesChange && (
                  <FilePickerSection
                    title="Arcada Inferior (STL/PLY)"
                    description="Arrastra archivos entre secciones para reorganizar"
                    acceptedTypes={ALLOWED_SCAN_TYPES.join(',')}
                    maxFiles={MAX_FILES_PER_CATEGORY}
                    maxSizeMB={MAX_FILE_SIZE_MB}
                    files={lowerFiles}
                    onFilesChange={onLowerFilesChange}
                    icon="upload"
                    category="lower"
                    onInterZoneDrop={handleInterZoneDrop}
                    onFileDragStart={handleFileDragStart}
                    enableInterZoneDrag
                    hideAddButton
                  />
                )}

                {/* Bite Scan */}
                {onBiteFilesChange && (
                  <FilePickerSection
                    title="Escaneo de Mordida (STL/PLY)"
                    description="Arrastra archivos entre secciones para reorganizar"
                    acceptedTypes={ALLOWED_SCAN_TYPES.join(',')}
                    maxFiles={MAX_FILES_PER_CATEGORY}
                    maxSizeMB={MAX_FILE_SIZE_MB}
                    files={biteFiles}
                    onFilesChange={onBiteFilesChange}
                    icon="upload"
                    category="bite"
                    onInterZoneDrop={handleInterZoneDrop}
                    onFileDragStart={handleFileDragStart}
                    enableInterZoneDrag
                    hideAddButton
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Mismatch Confirmation Modal */}
        {mismatchConfirmation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => handleMismatchConfirm(false)}
          >
            <div
              className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Confirmar ubicación del archivo
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                El archivo{' '}
                <span className="font-medium text-foreground">
                  {mismatchConfirmation.file.name}
                </span>{' '}
                parece ser de{' '}
                <span className="font-medium text-primary">
                  {SCAN_CATEGORY_LABELS[mismatchConfirmation.detectedCategory]}
                </span>
                . ¿Deseas agregarlo a{' '}
                <span className="font-medium text-primary">
                  {SCAN_CATEGORY_LABELS[mismatchConfirmation.targetCategory]}
                </span>{' '}
                de todos modos?
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleMismatchConfirm(false)}
                >
                  No, usar {SCAN_CATEGORY_LABELS[mismatchConfirmation.detectedCategory]}
                </Button>
                <Button type="button" variant="primary" onClick={() => handleMismatchConfirm(true)}>
                  Sí, agregar a {SCAN_CATEGORY_LABELS[mismatchConfirmation.targetCategory]}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSubsection>
  );
}
