'use client';

import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ImplantInfo } from '@/types/order';
import { CollapsibleSubsection } from '@/components/ui/form';

type ImplantSectionProps = {
  trabajoSobreImplante?: boolean;
  informacionImplante?: ImplantInfo;
  onChange: (updates: {
    trabajoSobreImplante?: boolean;
    informacionImplante?: ImplantInfo;
  }) => void;
  errors?: {
    trabajoSobreImplante?: string;
    marcaImplante?: string;
    sistemaConexion?: string;
    numeroImplantes?: string;
    tipoRestauracion?: string;
    tipoAditamento?: string;
    perfilEmergencia?: string;
    condicionTejidoBlando?: string;
  };
};

export function ImplantSection({
  trabajoSobreImplante,
  informacionImplante,
  onChange,
  errors,
}: ImplantSectionProps) {
    const handleToggle = (checked: boolean) => {
      if (checked) {
        onChange({ trabajoSobreImplante: true });
      } else {
        // Clear both fields when unchecking
        onChange({ trabajoSobreImplante: false, informacionImplante: undefined });
      }
    };

    const handleImplantFieldChange = <K extends keyof ImplantInfo>(
      field: K,
      value: ImplantInfo[K]
    ) => {
      const updated = {
        marcaImplante: informacionImplante?.marcaImplante ?? '',
        sistemaConexion: informacionImplante?.sistemaConexion ?? '',
        numeroImplantes: informacionImplante?.numeroImplantes ?? 1,
        tipoRestauracion: informacionImplante?.tipoRestauracion ?? 'individual',
        tipoAditamento: informacionImplante?.tipoAditamento ?? 'estandar',
        perfilEmergencia: informacionImplante?.perfilEmergencia ?? 'recto',
        condicionTejidoBlando: informacionImplante?.condicionTejidoBlando ?? 'sano',
        radiografiaPeriapical: informacionImplante?.radiografiaPeriapical ?? '',
        cbct: informacionImplante?.cbct ?? '',
        ...informacionImplante,
        [field]: value,
      } as ImplantInfo;

      onChange({ informacionImplante: updated });
    };

  return (
    <CollapsibleSubsection icon="settings" title="Información de Implantes">
      <div className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <Checkbox
              label="¿Es un trabajo sobre implante?"
              checked={trabajoSobreImplante === true}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            {errors?.trabajoSobreImplante && (
              <p className="mt-2 text-sm text-danger font-medium">{errors.trabajoSobreImplante}</p>
            )}
          </div>

          {/* Conditionally render detailed implant fields */}
          {trabajoSobreImplante && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Marca del Implante"
                  type="text"
                  value={informacionImplante?.marcaImplante || ''}
                  onChange={(e) => handleImplantFieldChange('marcaImplante', e.target.value)}
                  placeholder="Straumann, Nobel Biocare..."
                  required
                  error={errors?.marcaImplante}
                />

                <Input
                  label="Sistema de Conexión"
                  type="text"
                  value={informacionImplante?.sistemaConexion || ''}
                  onChange={(e) => handleImplantFieldChange('sistemaConexion', e.target.value)}
                  placeholder="Internal hex, External hex..."
                  required
                  error={errors?.sistemaConexion}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Número de Implantes"
                  type="number"
                  min={1}
                  value={informacionImplante?.numeroImplantes?.toString() || '1'}
                  onChange={(e) =>
                    handleImplantFieldChange('numeroImplantes', parseInt(e.target.value) || 1)
                  }
                  required
                  error={errors?.numeroImplantes}
                />

                <Select
                  label="Tipo de Restauración"
                  value={informacionImplante?.tipoRestauracion || 'individual'}
                  onChange={(e) =>
                    handleImplantFieldChange(
                      'tipoRestauracion',
                      e.target.value as ImplantInfo['tipoRestauracion']
                    )
                  }
                  required
                  error={errors?.tipoRestauracion}
                >
                  <option value="individual">Individual</option>
                  <option value="ferulizada">Ferulizada</option>
                  <option value="hibrida">Híbrida</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Tipo de Aditamento"
                  value={informacionImplante?.tipoAditamento || 'estandar'}
                  onChange={(e) =>
                    handleImplantFieldChange(
                      'tipoAditamento',
                      e.target.value as ImplantInfo['tipoAditamento']
                    )
                  }
                  required
                  error={errors?.tipoAditamento}
                >
                  <option value="estandar">Estándar</option>
                  <option value="personalizado">Personalizado</option>
                  <option value="multi_unit">Multi-Unit</option>
                </Select>

                <Select
                  label="Perfil de Emergencia"
                  value={informacionImplante?.perfilEmergencia || 'recto'}
                  onChange={(e) =>
                    handleImplantFieldChange(
                      'perfilEmergencia',
                      e.target.value as ImplantInfo['perfilEmergencia']
                    )
                  }
                  required
                  error={errors?.perfilEmergencia}
                >
                  <option value="recto">Recto</option>
                  <option value="concavo">Cóncavo</option>
                  <option value="convexo">Convexo</option>
                </Select>
              </div>

              <Select
                label="Condición del Tejido Blando"
                value={informacionImplante?.condicionTejidoBlando || 'sano'}
                onChange={(e) =>
                  handleImplantFieldChange(
                    'condicionTejidoBlando',
                    e.target.value as ImplantInfo['condicionTejidoBlando']
                  )
                }
                required
                error={errors?.condicionTejidoBlando}
              >
                <option value="sano">Sano</option>
                <option value="inflamado">Inflamado</option>
                <option value="retraido">Retraído</option>
              </Select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Radiografía Periapical"
                  type="text"
                  value={informacionImplante?.radiografiaPeriapical || ''}
                  onChange={(e) =>
                    handleImplantFieldChange('radiografiaPeriapical', e.target.value)
                  }
                  placeholder="Descripción o ubicación de la radiografía"
                />

                <Input
                  label="CBCT"
                  type="text"
                  value={informacionImplante?.cbct || ''}
                  onChange={(e) => handleImplantFieldChange('cbct', e.target.value)}
                  placeholder="Descripción o ubicación del CBCT"
                />
              </div>
            </div>
          )}
      </div>
    </CollapsibleSubsection>
  );
}
