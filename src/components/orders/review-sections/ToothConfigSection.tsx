import { DetailRow, SectionTitle } from './ReviewSectionComponents';
import { Odontogram } from '@/components/clinic-staff/order-form/Odontogram';
import { CollapsibleToothList } from '../CollapsibleToothCard';
import type { ToothData } from '@/types/tooth';

interface ToothConfigSectionProps {
  teeth?: ToothData[];
}

export function ToothConfigSection({ teeth }: ToothConfigSectionProps) {
  if (!teeth || teeth.length === 0) return null;

  const renderToothDetails = (tooth: ToothData) => (
    <dl className="space-y-1">
      {tooth.tipoRestauracion && (
        <DetailRow
          label="Tipo de Restauración"
          value={
            tooth.tipoRestauracion === 'corona'
              ? 'Corona'
              : tooth.tipoRestauracion === 'puente'
                ? 'Puente'
                : tooth.tipoRestauracion === 'inlay'
                  ? 'Inlay'
                  : tooth.tipoRestauracion === 'onlay'
                    ? 'Onlay'
                    : tooth.tipoRestauracion === 'carilla'
                      ? 'Carilla'
                      : 'Provisional'
          }
        />
      )}
      {tooth.material && <DetailRow label="Material" value={tooth.material} />}
      {tooth.colorInfo && typeof tooth.colorInfo === 'object' && (
        <>
          {(tooth.colorInfo as any).shadeCode && (
            <DetailRow label="Código de Color" value={(tooth.colorInfo as any).shadeCode} />
          )}
          {(tooth.colorInfo as any).shadeType && (
            <DetailRow label="Tipo de Guía de Color" value={(tooth.colorInfo as any).shadeType} />
          )}
        </>
      )}
      {tooth.trabajoSobreImplante && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-1">Trabajo sobre Implante</p>
          {tooth.informacionImplante && typeof tooth.informacionImplante === 'object' && (
            <dl className="ml-4 space-y-1">
              {(tooth.informacionImplante as any).marcaImplante && (
                <DetailRow
                  label="Marca del Implante"
                  value={(tooth.informacionImplante as any).marcaImplante}
                />
              )}
              {(tooth.informacionImplante as any).sistemaConexion && (
                <DetailRow
                  label="Sistema de Conexión"
                  value={(tooth.informacionImplante as any).sistemaConexion}
                />
              )}
              {(tooth.informacionImplante as any).numeroImplantes && (
                <DetailRow
                  label="Número de Implantes"
                  value={(tooth.informacionImplante as any).numeroImplantes}
                />
              )}
            </dl>
          )}
        </div>
      )}
    </dl>
  );

  return (
    <>
      <SectionTitle>Configuración por Diente</SectionTitle>

      {/* Visual Odontogram (read-only) */}
      <div className="mb-6">
        <Odontogram
          selectedTeeth={teeth.map((t) => t.toothNumber)}
          currentTooth={null}
          teethWithData={
            new Set(
              teeth
                .filter((t) => t.material || t.tipoRestauracion || t.trabajoSobreImplante)
                .map((t) => t.toothNumber)
            )
          }
          teethWithErrors={new Set()}
          readOnly={true}
        />
      </div>

      {/* Detailed configuration for each tooth */}
      <h3 className="text-sm font-semibold text-foreground mb-3">Detalles por Diente</h3>
      <CollapsibleToothList teeth={teeth} renderToothDetails={renderToothDetails} />
    </>
  );
}
