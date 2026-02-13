'use client';

import { useMemo } from 'react';
import { RestorationType } from '@prisma/client';
import { Icons } from '@/components/ui/Icons';
import { ToothData, BridgeDefinition } from '@/types/tooth';
import { InitialToothStatesMap } from '@/types/initial-tooth-state';
import { BridgeGroupCard } from './BridgeGroupCard';
import { RestorationGroupCard } from './RestorationGroupCard';

interface AssignedWorkListProps {
  teethData: Map<string, ToothData>;
  bridges: BridgeDefinition[];
  initialStates: InitialToothStatesMap;
  onBulkToothUpdate: (updates: Map<string, Partial<ToothData>>) => void;
  onToothRemove: (toothNumber: string) => void;
  onBridgeUpdate: (bridgeId: string, updates: Partial<BridgeDefinition>) => void;
  onBridgeRemove: (bridgeId: string) => void;
  disabled?: boolean;
}

export const WORK_TYPE_LABELS: Record<RestorationType, string> = {
  // Restauraciones por diente
  corona: 'Coronas',
  puente: 'Puentes',
  incrustacion: 'Incrustaciones',
  maryland: 'Maryland',
  carilla: 'Carillas',
  provisional: 'Provisionales',
  // Sobre implantes
  pilar: 'Pilares',
  barra: 'Barras',
  hibrida: 'Híbridas',
  toronto: 'Toronto',
  // Prótesis removible
  removible: 'Removibles',
  parcial: 'Parciales',
  total: 'Totales',
  sobredentadura: 'Sobredentaduras',
  // Diagnóstico/Planificación
  encerado: 'Encerados',
  mockup: 'Mockups',
  guia_quirurgica: 'Guías Quirúrgicas',
  prototipo: 'Prototipos',
  guarda_oclusal: 'Guardas Oclusales',
};

export function AssignedWorkList({
  teethData,
  bridges,
  initialStates,
  onBulkToothUpdate,
  onToothRemove,
  onBridgeUpdate,
  onBridgeRemove,
  disabled = false,
}: AssignedWorkListProps) {
  // Get bridge teeth set for filtering
  const bridgeTeethSet = useMemo(() => {
    const bridgeTeeth = new Set<string>();
    bridges.forEach((bridge) => {
      bridgeTeeth.add(bridge.startTooth);
      bridgeTeeth.add(bridge.endTooth);
      bridge.pontics.forEach((p) => bridgeTeeth.add(p));
    });
    return bridgeTeeth;
  }, [bridges]);

  // Group teeth by work type (excluding bridge teeth which are handled separately)
  const teethByWorkType = useMemo(() => {
    const groups = new Map<RestorationType, ToothData[]>();

    for (const [toothNumber, data] of teethData) {
      if (bridgeTeethSet.has(toothNumber)) continue; // Skip bridge teeth
      if (!data.tipoRestauracion) continue; // Skip teeth without work type

      const workType = data.tipoRestauracion;
      if (!groups.has(workType)) {
        groups.set(workType, []);
      }
      groups.get(workType)!.push(data);
    }

    // Sort teeth within each group
    groups.forEach((teeth) => {
      teeth.sort((a, b) => parseInt(a.toothNumber, 10) - parseInt(b.toothNumber, 10));
    });

    return groups;
  }, [teethData, bridgeTeethSet]);

  const hasAnyWork = teethByWorkType.size > 0 || bridges.length > 0;

  if (!hasAnyWork) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icons.tooth className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No hay trabajos asignados</p>
        <p className="text-xs mt-1">Selecciona un tipo de trabajo y haz clic en los dientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Icons.clipboardList className="h-5 w-5" />
        Trabajos Asignados
      </h3>

      {/* Bridges Section */}
      {bridges.length > 0 && (
        <BridgeGroupCard
          bridges={bridges}
          onBridgeUpdate={onBridgeUpdate}
          onBridgeRemove={onBridgeRemove}
          disabled={disabled}
        />
      )}

      {/* Restoration type groups */}
      {Array.from(teethByWorkType.entries()).map(([workType, teeth]) => {
        if (workType === 'puente') return null; // Bridges handled above

        return (
          <RestorationGroupCard
            key={workType}
            restorationType={workType}
            teeth={teeth}
            initialStates={initialStates}
            onBulkToothUpdate={onBulkToothUpdate}
            onToothRemove={onToothRemove}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
