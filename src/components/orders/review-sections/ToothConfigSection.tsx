import { useMemo } from 'react';
import { DetailRow, SectionTitle } from './ReviewSectionComponents';
import { Odontogram } from '@/components/clinic-staff/order-form/Odontogram';
import { Icons } from '@/components/ui/Icons';
import { getToothConfigStatus, type ToothData, type ToothConfigStatus } from '@/types/tooth';
import type { RestorationType } from '@prisma/client';

interface ToothConfigSectionProps {
  teeth?: ToothData[];
}

// Map restoration type to Spanish display name
const RESTORATION_TYPE_LABELS: Record<RestorationType, string> = {
  corona: 'Coronas',
  puente: 'Puentes',
  inlay: 'Inlays',
  onlay: 'Onlays',
  carilla: 'Carillas',
  provisional: 'Provisionales',
  pilar: 'Pilares',
  barra: 'Barras',
  hibrida: 'Híbridas',
  toronto: 'Toronto',
  removible: 'Removibles',
  parcial: 'Parciales',
  total: 'Totales',
  sobredentadura: 'Sobredentaduras',
  encerado: 'Encerados',
  mockup: 'Mockups',
  guia_quirurgica: 'Guías Quirúrgicas',
  prototipo: 'Prototipos',
  guarda_oclusal: 'Guardas Oclusales',
};

// Singular form for display
const RESTORATION_TYPE_SINGULAR: Record<RestorationType, string> = {
  corona: 'Corona',
  puente: 'Puente',
  inlay: 'Inlay',
  onlay: 'Onlay',
  carilla: 'Carilla',
  provisional: 'Provisional',
  pilar: 'Pilar',
  barra: 'Barra',
  hibrida: 'Híbrida',
  toronto: 'Toronto',
  removible: 'Removible',
  parcial: 'Parcial',
  total: 'Total',
  sobredentadura: 'Sobredentadura',
  encerado: 'Encerado',
  mockup: 'Mockup',
  guia_quirurgica: 'Guía Quirúrgica',
  prototipo: 'Prototipo',
  guarda_oclusal: 'Guarda Oclusal',
};

interface ToothGroup {
  key: string;
  title: string;
  icon: React.ReactNode;
  teeth: ToothData[];
  isImplant: boolean;
}

export function ToothConfigSection({ teeth }: ToothConfigSectionProps) {
  if (!teeth || teeth.length === 0) return null;

  // Group teeth: first by implants, then by restoration type
  const groups = useMemo(() => {
    const result: ToothGroup[] = [];

    // Separate implant teeth from non-implant teeth
    const implantTeeth = teeth.filter((t) => t.trabajoSobreImplante);
    const nonImplantTeeth = teeth.filter((t) => !t.trabajoSobreImplante);

    // Add implant group if there are any
    if (implantTeeth.length > 0) {
      result.push({
        key: 'implantes',
        title: 'Implantes',
        icon: <Icons.screw className="h-5 w-5" />,
        teeth: implantTeeth,
        isImplant: true,
      });
    }

    // Group non-implant teeth by restoration type
    const byRestorationType = new Map<RestorationType, ToothData[]>();
    for (const tooth of nonImplantTeeth) {
      if (tooth.tipoRestauracion) {
        const existing = byRestorationType.get(tooth.tipoRestauracion) || [];
        existing.push(tooth);
        byRestorationType.set(tooth.tipoRestauracion, existing);
      }
    }

    // Add restoration type groups
    for (const [type, groupTeeth] of byRestorationType) {
      result.push({
        key: type,
        title: RESTORATION_TYPE_LABELS[type],
        icon: <Icons.tooth className="h-5 w-5" />,
        teeth: groupTeeth,
        isImplant: false,
      });
    }

    return result;
  }, [teeth]);

  return (
    <>
      <SectionTitle>Configuración por Diente</SectionTitle>

      {/* Visual Odontogram (read-only) */}
      <div className="mb-6">
        <Odontogram
          teethInOrder={teeth.map((t) => t.toothNumber)}
          selectedForConfig={[]} // No selection in read-only mode
          teethConfigStatus={new Map(teeth.map((t) => [t.toothNumber, getToothConfigStatus(t)]))}
          teethWithErrors={new Set()}
          readOnly={true}
        />
      </div>

      {/* Grouped teeth display */}
      <div className="space-y-6">
        {groups.map((group) => (
          <ToothGroupCard key={group.key} group={group} />
        ))}
      </div>
    </>
  );
}

interface ToothGroupCardProps {
  group: ToothGroup;
}

function ToothGroupCard({ group }: ToothGroupCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      {/* Group Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <div className="text-primary">{group.icon}</div>
        <h4 className="font-semibold text-foreground">{group.title}</h4>
        <div className="flex items-center gap-1.5 ml-auto">
          {group.teeth.map((tooth) => (
            <span
              key={tooth.toothNumber}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm"
            >
              {tooth.toothNumber}
            </span>
          ))}
        </div>
      </div>

      {/* Teeth Details */}
      <div className="divide-y divide-border">
        {group.teeth.map((tooth) => (
          <ToothDetailRow
            key={tooth.toothNumber}
            tooth={tooth}
            showRestorationType={group.isImplant}
          />
        ))}
      </div>
    </div>
  );
}

interface ToothDetailRowProps {
  tooth: ToothData;
  showRestorationType: boolean;
}

function ToothDetailRow({ tooth, showRestorationType }: ToothDetailRowProps) {
  const colorInfo = tooth.colorInfo as { shadeCode?: string; shadeType?: string } | undefined;
  const implantInfo = tooth.informacionImplante as
    | {
        marcaImplante?: string;
        sistemaConexion?: string;
        numeroImplantes?: number;
      }
    | undefined;

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Tooth number badge */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
          {tooth.toothNumber}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {/* Restoration type (only shown in implant group) */}
            {showRestorationType && tooth.tipoRestauracion && (
              <div>
                <span className="text-muted-foreground">Tipo: </span>
                <span className="text-foreground font-medium">
                  {RESTORATION_TYPE_SINGULAR[tooth.tipoRestauracion]}
                </span>
              </div>
            )}

            {/* Material */}
            {tooth.material && (
              <div>
                <span className="text-muted-foreground">Material: </span>
                <span className="text-foreground font-medium">{tooth.material}</span>
              </div>
            )}

            {/* Color */}
            {colorInfo?.shadeCode && (
              <div>
                <span className="text-muted-foreground">Color: </span>
                <span className="text-foreground font-medium">
                  {colorInfo.shadeCode}
                  {colorInfo.shadeType && ` (${colorInfo.shadeType})`}
                </span>
              </div>
            )}
          </div>

          {/* Implant details */}
          {tooth.trabajoSobreImplante && implantInfo && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {implantInfo.marcaImplante && (
                  <div>
                    <span className="text-muted-foreground">Marca: </span>
                    <span className="text-foreground font-medium">{implantInfo.marcaImplante}</span>
                  </div>
                )}
                {implantInfo.sistemaConexion && (
                  <div>
                    <span className="text-muted-foreground">Sistema: </span>
                    <span className="text-foreground font-medium">
                      {implantInfo.sistemaConexion}
                    </span>
                  </div>
                )}
                {implantInfo.numeroImplantes && (
                  <div>
                    <span className="text-muted-foreground">Nº Implantes: </span>
                    <span className="text-foreground font-medium">
                      {implantInfo.numeroImplantes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
