'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { ImplantInfo } from '@/types/order';

export interface ImplantData {
  toothNumber: string;
  marcaImplante?: string;
  sistemaConexion?: string;
  scanbody?: string;
  tipoAditamento?: string;
  perfilEmergencia?: string;
  tipoRestauracion?: string;
}

interface ImplantInfoListProps {
  implants: ImplantData[];
  onImplantUpdate: (toothNumber: string, updates: Partial<ImplantInfo>) => void;
  disabled?: boolean;
}

export function ImplantInfoList({
  implants,
  onImplantUpdate,
  disabled = false,
}: ImplantInfoListProps) {
  if (implants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icons.implant className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-foreground">
          Información de Implantes ({implants.length})
        </h4>
      </div>

      <p className="text-sm text-muted-foreground">
        Completa la información de los implantes marcados para continuar.
      </p>

      <div className="space-y-2">
        {implants
          .sort((a, b) => parseInt(a.toothNumber, 10) - parseInt(b.toothNumber, 10))
          .map((implant) => (
            <div
              key={implant.toothNumber}
              className="space-y-2 py-2 px-3 bg-primary/5 rounded-lg border border-primary/20"
            >
              {/* Row 1: Tooth number + Marca + Conexión */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 min-w-[70px]">
                  <Icons.implant className="h-4 w-4 text-primary" />
                  <span className="font-bold text-primary">#{implant.toothNumber}</span>
                </div>

                <div className="flex-1 min-w-[140px]">
                  <Input
                    value={implant.marcaImplante || ''}
                    onChange={(e) =>
                      onImplantUpdate(implant.toothNumber, {
                        marcaImplante: e.target.value || undefined,
                      })
                    }
                    disabled={disabled}
                    placeholder="Marca del implante *"
                    className="text-sm h-8"
                  />
                </div>

                <div className="flex-1 min-w-[140px]">
                  <Input
                    value={implant.sistemaConexion || ''}
                    onChange={(e) =>
                      onImplantUpdate(implant.toothNumber, {
                        sistemaConexion: e.target.value || undefined,
                      })
                    }
                    disabled={disabled}
                    placeholder="Sistema de conexión *"
                    className="text-sm h-8"
                  />
                </div>
              </div>

              {/* Row 2: Scanbody + Aditamento */}
              <div className="flex flex-wrap items-center gap-2 pl-[78px]">
                <div className="flex-1 min-w-[140px]">
                  <Input
                    value={implant.scanbody || ''}
                    onChange={(e) =>
                      onImplantUpdate(implant.toothNumber, {
                        scanbody: e.target.value || undefined,
                      })
                    }
                    disabled={disabled}
                    placeholder="Scanbody"
                    className="text-sm h-8"
                  />
                </div>

                <div className="flex-1 min-w-[140px]">
                  <Select
                    value={implant.tipoAditamento || ''}
                    onChange={(e) =>
                      onImplantUpdate(implant.toothNumber, {
                        tipoAditamento:
                          (e.target.value as ImplantInfo['tipoAditamento']) || undefined,
                      })
                    }
                    disabled={disabled}
                    className="text-sm !py-1.5"
                  >
                    <option value="">Tipo aditamento</option>
                    <option value="estandar">Estándar</option>
                    <option value="personalizado">Personalizado</option>
                    <option value="multi_unit">Multi-unit</option>
                  </Select>
                </div>
              </div>

              {/* Row 3: Perfil emergencia + Tipo restauración */}
              <div className="flex flex-wrap items-center gap-2 pl-[78px]">
                <div className="flex-1 min-w-[140px]">
                  <Select
                    value={implant.perfilEmergencia || ''}
                    onChange={(e) =>
                      onImplantUpdate(implant.toothNumber, {
                        perfilEmergencia:
                          (e.target.value as ImplantInfo['perfilEmergencia']) || undefined,
                      })
                    }
                    disabled={disabled}
                    className="text-sm !py-1.5"
                  >
                    <option value="">Perfil de emergencia</option>
                    <option value="recto">Recto</option>
                    <option value="concavo">Cóncavo</option>
                    <option value="convexo">Convexo</option>
                  </Select>
                </div>

                <div className="flex-1 min-w-[140px]">
                  <Select
                    value={implant.tipoRestauracion || ''}
                    onChange={(e) =>
                      onImplantUpdate(implant.toothNumber, {
                        tipoRestauracion:
                          (e.target.value as ImplantInfo['tipoRestauracion']) || undefined,
                      })
                    }
                    disabled={disabled}
                    className="text-sm !py-1.5"
                  >
                    <option value="">Tipo de restauración</option>
                    <option value="individual">Individual</option>
                    <option value="ferulizada">Ferulizada</option>
                    <option value="hibrida">Híbrida</option>
                  </Select>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * Check if all implants have complete information
 */
export function areImplantsComplete(implants: ImplantData[]): boolean {
  if (implants.length === 0) return true;
  return implants.every(
    (implant) =>
      implant.marcaImplante &&
      implant.marcaImplante.trim() !== '' &&
      implant.sistemaConexion &&
      implant.sistemaConexion.trim() !== ''
  );
}
