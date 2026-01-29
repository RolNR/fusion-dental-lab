'use client';

import { useMemo, useCallback } from 'react';
import { RestorationType } from '@prisma/client';
import { Icons } from '@/components/ui/Icons';
import { ToothData, BridgeDefinition } from '@/types/tooth';
import { InitialToothStatesMap } from '@/types/initial-tooth-state';
import { ToothWorkItem } from './ToothWorkItem';
import { BridgeWorkItem } from './BridgeWorkItem';
import { BulkColorConfig } from './BulkColorConfig';

interface AssignedWorkListProps {
  teethData: Map<string, ToothData>;
  bridges: BridgeDefinition[];
  initialStates: InitialToothStatesMap;
  onToothUpdate: (toothNumber: string, updates: Partial<ToothData>) => void;
  onBulkToothUpdate: (updates: Map<string, Partial<ToothData>>) => void;
  onToothRemove: (toothNumber: string) => void;
  onBridgeUpdate: (bridgeId: string, updates: Partial<BridgeDefinition>) => void;
  onBridgeRemove: (bridgeId: string) => void;
  disabled?: boolean;
}

const WORK_TYPE_LABELS: Record<RestorationType, string> = {
  corona: 'Coronas',
  puente: 'Puentes',
  inlay: 'Inlays',
  onlay: 'Onlays',
  carilla: 'Carillas',
  provisional: 'Provisionales',
};

export function AssignedWorkList({
  teethData,
  bridges,
  initialStates,
  onToothUpdate,
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

  // Handler for bulk applying color to teeth
  const handleApplyToTeeth = useCallback(
    (material: string, shadeType: string, shadeCode: string, filter: 'all' | RestorationType) => {
      const bulkUpdates = new Map<string, Partial<ToothData>>();

      for (const [toothNumber, data] of teethData) {
        // Skip bridge teeth - bridges are handled separately
        if (data.tipoRestauracion === 'puente') continue;
        if (!data.tipoRestauracion) continue; // Skip teeth without work type

        // Apply filter
        if (filter !== 'all' && data.tipoRestauracion !== filter) continue;

        // Build updates
        const updates: Partial<ToothData> = {};
        if (material) {
          updates.material = material;
        }
        if (shadeType || shadeCode) {
          updates.colorInfo = {
            ...data.colorInfo,
            ...(shadeType && { shadeType }),
            ...(shadeCode && { shadeCode }),
          };
        }

        if (Object.keys(updates).length > 0) {
          bulkUpdates.set(toothNumber, updates);
        }
      }

      if (bulkUpdates.size > 0) {
        onBulkToothUpdate(bulkUpdates);
      }
    },
    [teethData, onBulkToothUpdate]
  );

  // Handler for bulk applying color to bridges
  const handleApplyToBridges = useCallback(
    (material: string, shadeType: string, shadeCode: string) => {
      bridges.forEach((bridge) => {
        const updates: Partial<BridgeDefinition> = {};
        if (material) {
          updates.material = material;
        }
        if (shadeType || shadeCode) {
          updates.colorInfo = {
            ...bridge.colorInfo,
            ...(shadeType && { shadeType }),
            ...(shadeCode && { shadeCode }),
          };
        }

        if (Object.keys(updates).length > 0) {
          onBridgeUpdate(bridge.id, updates);
        }
      });
    },
    [bridges, onBridgeUpdate]
  );

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

      {/* Bulk Color Configuration */}
      <BulkColorConfig
        teethData={teethData}
        bridges={bridges}
        onApplyToTeeth={handleApplyToTeeth}
        onApplyToBridges={handleApplyToBridges}
        disabled={disabled}
      />

      {/* Bridges Section */}
      {bridges.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Icons.copy className="h-4 w-4 text-primary" />
            <span>
              {WORK_TYPE_LABELS.puente} ({bridges.length})
            </span>
          </div>
          <div className="space-y-2 pl-6">
            {bridges.map((bridge) => (
              <BridgeWorkItem
                key={bridge.id}
                bridge={bridge}
                onUpdate={onBridgeUpdate}
                onRemove={onBridgeRemove}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Individual work types */}
      {Array.from(teethByWorkType.entries()).map(([workType, teeth]) => {
        if (workType === 'puente') return null; // Bridges handled above

        return (
          <div key={workType} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/20" />
              <span>
                {WORK_TYPE_LABELS[workType]} ({teeth.length})
              </span>
            </div>
            <div className="space-y-2 pl-6">
              {teeth.map((tooth) => (
                <ToothWorkItem
                  key={tooth.toothNumber}
                  toothNumber={tooth.toothNumber}
                  toothData={tooth}
                  onUpdate={onToothUpdate}
                  onRemove={onToothRemove}
                  disabled={disabled}
                  isImplante={initialStates[tooth.toothNumber] === 'IMPLANTE'}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
