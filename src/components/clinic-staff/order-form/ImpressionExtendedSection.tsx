'use client';

import { forwardRef } from 'react';
import { ScanType, ScannerType, SiliconType } from '@prisma/client';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { SectionContainer, SectionHeader, ButtonCard, FieldLabel } from '@/components/ui/form';
import { getScanTypeOptions } from '@/lib/scanTypeUtils';
import { FilePickerSection } from './FilePickerSection';
import { ALLOWED_SCAN_TYPES, MAX_FILES_PER_CATEGORY, MAX_FILE_SIZE_MB } from '@/types/file';

type ImpressionExtendedSectionProps = {
  scanType?: ScanType | null;
  escanerUtilizado?: ScannerType;
  otroEscaner?: string;
  tipoSilicon?: SiliconType;
  notaModeloFisico?: string;
  upperFiles?: File[];
  lowerFiles?: File[];
  biteFiles?: File[];
  onUpperFilesChange?: (files: File[]) => void;
  onLowerFilesChange?: (files: File[]) => void;
  onBiteFilesChange?: (files: File[]) => void;
  onChange: (field: string, value: string | ScanType | null | undefined) => void;
  errors?: {
    scanType?: string;
    escanerUtilizado?: string;
    otroEscaner?: string;
    tipoSilicon?: string;
    notaModeloFisico?: string;
  };
  disabled?: boolean;
  hasErrors?: boolean;
  errorCount?: number;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
};

export const ImpressionExtendedSection = forwardRef<HTMLDivElement, ImpressionExtendedSectionProps>(
  (
    {
      scanType,
      escanerUtilizado,
      otroEscaner,
      tipoSilicon,
      notaModeloFisico,
      upperFiles = [],
      lowerFiles = [],
      biteFiles = [],
      onUpperFilesChange,
      onLowerFilesChange,
      onBiteFilesChange,
      onChange,
      errors,
      disabled = false,
      hasErrors,
      errorCount,
      collapsed,
      onCollapseChange,
    },
    ref
  ) => {
    const handleEscanerChange = (value: string) => {
      const scannerValue = value === '' ? null : (value as ScannerType);
      onChange('escanerUtilizado', scannerValue || undefined);

      // Clear "other scanner" field if not "Otro"
      if (value !== ScannerType.Otro) {
        onChange('otroEscaner', undefined);
      }
    };

    const scanTypeOptions = [
      {
        value: ScanType.DIGITAL_SCAN,
        label: 'Escaneo Digital',
        subtitle: 'Captura digital intraoral',
        icon: 'upload' as const,
      },
      {
        value: ScanType.ANALOG_MOLD,
        label: 'Molde Análogo',
        subtitle: 'Impresión tradicional',
        icon: 'file' as const,
      },
    ];

    return (
      <SectionContainer
        ref={ref}
        hasErrors={hasErrors}
        errorCount={errorCount}
        collapsed={collapsed}
        onCollapseChange={onCollapseChange}
      >
        <SectionHeader
          icon="settings"
          title="Detalles de Impresión"
          description="Método de captura y especificaciones técnicas"
        />

        <div className="space-y-6 p-6">
          {/* Scan Type Selector */}
          <div>
            <FieldLabel label="Tipo de Escaneo" />
            <div className="grid grid-cols-2 gap-3">
              {scanTypeOptions.map((option) => (
                <ButtonCard
                  key={option.value}
                  icon={option.icon}
                  title={option.label}
                  subtitle={option.subtitle}
                  selected={scanType === option.value}
                  onClick={() => onChange('scanType', option.value)}
                  disabled={disabled}
                />
              ))}
            </div>
            {errors?.scanType && (
              <p className="mt-2 text-sm text-danger font-medium">{errors.scanType}</p>
            )}
          </div>

          {/* Digital Scan - Scanner Type */}
          {scanType === ScanType.DIGITAL_SCAN && (
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
                  onChange={(e) => onChange('otroEscaner', e.target.value)}
                  placeholder="Nombre del escáner..."
                  error={errors?.otroEscaner}
                  required
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

          {/* Analog Impression - Silicon Type */}
          {scanType === ScanType.ANALOG_MOLD && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <div>
                <FieldLabel label="Tipo de Silicón" />
                <div className="grid grid-cols-2 gap-3">
                  <ButtonCard
                    icon="check"
                    title="Adición"
                    subtitle="Silicón de adición"
                    selected={tipoSilicon === 'adicion'}
                    onClick={() => onChange('tipoSilicon', 'adicion')}
                  />
                  <ButtonCard
                    icon="check"
                    title="Condensación"
                    subtitle="Silicón de condensación"
                    selected={tipoSilicon === 'condensacion'}
                    onClick={() => onChange('tipoSilicon', 'condensacion')}
                  />
                </div>
                {errors?.tipoSilicon && (
                  <p className="mt-2 text-sm text-danger font-medium">{errors.tipoSilicon}</p>
                )}
              </div>

              {/* Physical Model Notes - Only for Analog */}
              <Textarea
                label="Notas del Modelo Físico"
                value={notaModeloFisico || ''}
                onChange={(e) => onChange('notaModeloFisico', e.target.value)}
                placeholder="Observaciones sobre el modelo físico enviado..."
                rows={3}
                error={errors?.notaModeloFisico}
              />
            </div>
          )}
        </div>
      </SectionContainer>
    );
  }
);

ImpressionExtendedSection.displayName = 'ImpressionExtendedSection';
