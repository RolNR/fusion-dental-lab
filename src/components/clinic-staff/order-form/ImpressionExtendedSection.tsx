'use client';

import { ScanType, ScannerType, SiliconType } from '@prisma/client';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Radio } from '@/components/ui/Radio';

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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Detalles de Impresión
      </h3>

      {/* Digital Scan - Scanner Type */}
      {scanType === ScanType.DIGITAL_SCAN && (
        <div className="space-y-4 rounded-lg bg-muted p-4">
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
        <div className="space-y-4 rounded-lg bg-muted p-4">
          <div>
            <label className="mb-3 block text-sm font-semibold text-foreground">
              Tipo de Silicón
            </label>
            <div className="space-y-3">
              <Radio
                name="tipoSilicon"
                value="adicion"
                checked={tipoSilicon === 'adicion'}
                onChange={(e) => onChange('tipoSilicon', e.target.value)}
                label="Adición"
              />

              <Radio
                name="tipoSilicon"
                value="condensacion"
                checked={tipoSilicon === 'condensacion'}
                onChange={(e) => onChange('tipoSilicon', e.target.value)}
                label="Condensación"
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
  );
}
