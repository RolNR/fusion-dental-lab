'use client';

import { ScanType, ScannerType, SiliconType } from '@prisma/client';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { SectionContainer, SectionHeader, ButtonCard, FieldLabel } from '@/components/ui/form';

type ImpressionExtendedSectionProps = {
  scanType?: ScanType | null;
  escanerUtilizado?: ScannerType;
  otroEscaner?: string;
  tipoSilicon?: SiliconType;
  notaModeloFisico?: string;
  onChange: (field: string, value: string | undefined) => void;
  errors?: {
    escanerUtilizado?: string;
    otroEscaner?: string;
    tipoSilicon?: string;
    notaModeloFisico?: string;
  };
};

export function ImpressionExtendedSection({
  scanType,
  escanerUtilizado,
  otroEscaner,
  tipoSilicon,
  notaModeloFisico,
  onChange,
  errors,
}: ImpressionExtendedSectionProps) {
  const handleEscanerChange = (value: string) => {
    onChange('escanerUtilizado', value || undefined);

    // Clear "other scanner" field if not "Otro"
    if (value !== 'Otro') {
      onChange('otroEscaner', undefined);
    }
  };

  return (
    <SectionContainer>
      <SectionHeader
        icon="settings"
        title="Detalles de Impresión"
        description="Información adicional sobre el método de impresión"
      />

      <div className="space-y-6 p-6">
        {/* Digital Scan - Scanner Type */}
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
          </div>
        )}

        {/* Physical Model Notes - Always Shown */}
        <Textarea
          label="Notas del Modelo Físico"
          value={notaModeloFisico || ''}
          onChange={(e) => onChange('notaModeloFisico', e.target.value)}
          placeholder="Observaciones sobre el modelo físico enviado..."
          rows={3}
          error={errors?.notaModeloFisico}
        />
      </div>
    </SectionContainer>
  );
}
