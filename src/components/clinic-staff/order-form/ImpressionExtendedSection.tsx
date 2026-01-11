'use client';

import { ScanType, ScannerType, SiliconType } from '@prisma/client';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import { FileCategory } from '@/types/file';
import { SectionContainer, SectionHeader, ButtonCard, FieldLabel } from '@/components/ui/form';
import { getScanTypeOptions } from '@/lib/scanTypeUtils';

type ImpressionExtendedSectionProps = {
  scanType?: ScanType | null;
  escanerUtilizado?: ScannerType;
  otroEscaner?: string;
  tipoSilicon?: SiliconType;
  notaModeloFisico?: string;
  onChange: (field: string, value: string | ScanType | null | undefined) => void;
  errors?: {
    scanType?: string;
    escanerUtilizado?: string;
    otroEscaner?: string;
    tipoSilicon?: string;
    notaModeloFisico?: string;
  };
  disabled?: boolean;
  // File upload props for digital scans
  upperFile?: File | null;
  lowerFile?: File | null;
  biteFile?: File | null;
  onUpperFileChange?: (file: File | null) => void;
  onLowerFileChange?: (file: File | null) => void;
  onBiteFileChange?: (file: File | null) => void;
};

export function ImpressionExtendedSection({
  scanType,
  escanerUtilizado,
  otroEscaner,
  tipoSilicon,
  notaModeloFisico,
  onChange,
  errors,
  disabled = false,
  upperFile,
  lowerFile,
  biteFile,
  onUpperFileChange,
  onLowerFileChange,
  onBiteFileChange,
}: ImpressionExtendedSectionProps) {
  const handleEscanerChange = (value: string) => {
    onChange('escanerUtilizado', value || undefined);

    // Clear "other scanner" field if not "Otro"
    if (value !== 'Otro') {
      onChange('otroEscaner', undefined);
    }
  };

  const scanTypeOptions = [
    { value: ScanType.DIGITAL_SCAN, label: 'Escaneo Digital', subtitle: 'Captura digital intraoral', icon: 'upload' as const },
    { value: ScanType.ANALOG_MOLD, label: 'Molde Análogo', subtitle: 'Impresión tradicional', icon: 'file' as const },
  ];

  return (
    <SectionContainer>
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

        {/* Digital Scan - Scanner Type & File Uploads */}
        {scanType === ScanType.DIGITAL_SCAN && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <Select
              label="Escáner Utilizado"
              value={escanerUtilizado || ''}
              onChange={(e) => handleEscanerChange(e.target.value)}
              error={errors?.escanerUtilizado}
            >
              <option value="">Selecciona un escáner</option>
              <option value="iTero">iTero</option>
              <option value="Medit">Medit</option>
              <option value="ThreeShape">3Shape</option>
              <option value="Carestream">Carestream</option>
              <option value="Otro">Otro</option>
            </Select>

            {/* Other Scanner Name */}
            {escanerUtilizado === 'Otro' && (
              <Input
                label="Especifica el Escáner"
                type="text"
                value={otroEscaner || ''}
                onChange={(e) => onChange('otroEscaner', e.target.value)}
                placeholder="Nombre del escáner..."
                error={errors?.otroEscaner}
              />
            )}

            {/* Digital Scan File Uploads */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Archivos de Escaneo Digital
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Sube los archivos STL o PLY de los escaneos (obligatorios)
                </p>
              </div>

              <FileUpload
                label="Escaneo Superior (Upper)"
                accept=".stl,.ply"
                maxSize={50}
                value={upperFile || null}
                onChange={onUpperFileChange || (() => {})}
                required
                category={FileCategory.SCAN_UPPER}
              />

              <FileUpload
                label="Escaneo Inferior (Lower)"
                accept=".stl,.ply"
                maxSize={50}
                value={lowerFile || null}
                onChange={onLowerFileChange || (() => {})}
                required
                category={FileCategory.SCAN_LOWER}
              />

              <FileUpload
                label="Escaneo de Mordida (Bite)"
                accept=".stl,.ply"
                maxSize={50}
                value={biteFile || null}
                onChange={onBiteFileChange || (() => {})}
                required
                category={FileCategory.SCAN_BITE}
              />
            </div>
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
