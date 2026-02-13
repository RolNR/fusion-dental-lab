'use client';

import { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { BridgeDefinition } from '@/types/tooth';
import { ColorInfo } from '@/types/order';
import { ToothColorFields } from './ToothColorFields';
import { deriveGroupState } from './groupConsensus';

interface BridgeGroupCardProps {
  bridges: BridgeDefinition[];
  onBridgeUpdate: (bridgeId: string, updates: Partial<BridgeDefinition>) => void;
  onBridgeRemove: (bridgeId: string) => void;
  disabled?: boolean;
}

export function BridgeGroupCard({
  bridges,
  onBridgeUpdate,
  onBridgeRemove,
  disabled = false,
}: BridgeGroupCardProps) {
  // Derive consensus state from all bridges
  const groupState = useMemo(
    () =>
      deriveGroupState(
        bridges.map((b) => b.material),
        bridges.map((b) => b.colorInfo as ColorInfo | undefined)
      ),
    [bridges]
  );

  const updateAllBridges = useCallback(
    (getUpdates: (bridge: BridgeDefinition) => Partial<BridgeDefinition>) => {
      for (const bridge of bridges) {
        onBridgeUpdate(bridge.id, getUpdates(bridge));
      }
    },
    [bridges, onBridgeUpdate]
  );

  const handleMaterialChange = useCallback(
    (value: string) => {
      updateAllBridges(() => ({ material: value || undefined }));
    },
    [updateAllBridges]
  );

  const handleShadeTypeChange = useCallback(
    (value: string) => {
      updateAllBridges((bridge) => ({
        colorInfo: {
          ...bridge.colorInfo,
          shadeType: value || null,
        },
      }));
    },
    [updateAllBridges]
  );

  const handleShadeCodeChange = useCallback(
    (value: string, inferredShadeType?: string) => {
      updateAllBridges((bridge) => ({
        colorInfo: {
          ...bridge.colorInfo,
          shadeCode: value || null,
          ...(inferredShadeType && { shadeType: inferredShadeType }),
        },
      }));
    },
    [updateAllBridges]
  );

  const handleUseZoneShadingChange = useCallback(
    (value: boolean) => {
      updateAllBridges((bridge) => ({
        colorInfo: {
          ...bridge.colorInfo,
          useZoneShading: value,
          ...(value
            ? { shadeCode: null }
            : { cervicalShade: null, medioShade: null, incisalShade: null }),
        },
      }));
    },
    [updateAllBridges]
  );

  const handleZoneShadeChange = useCallback(
    (zone: 'cervicalShade' | 'medioShade' | 'incisalShade', value: string, inferredShadeType?: string) => {
      updateAllBridges((bridge) => ({
        colorInfo: {
          ...bridge.colorInfo,
          [zone]: value || null,
          ...(inferredShadeType && { shadeType: inferredShadeType }),
        },
      }));
    },
    [updateAllBridges]
  );

  return (
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      {/* Group Header */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <Icons.copy className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground text-sm">Puentes ({bridges.length})</span>
        </div>

        {/* Bridge badges */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {bridges.map((bridge) => {
            const totalTeeth = 2 + bridge.pontics.length;
            return (
              <span
                key={bridge.id}
                className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs pl-2 pr-1 py-0.5"
              >
                {bridge.startTooth}-{bridge.endTooth}
                <span className="font-normal text-primary/60 ml-0.5">({totalTeeth})</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onBridgeRemove(bridge.id)}
                  disabled={disabled}
                  className="!p-0 !h-4 !w-4 !min-h-0 !text-primary/60 hover:!text-danger hover:!bg-transparent"
                  title={`Quitar puente ${bridge.startTooth}-${bridge.endTooth}`}
                >
                  <Icons.x className="h-3 w-3" />
                </Button>
              </span>
            );
          })}
        </div>
      </div>

      {/* Shared config fields */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <ToothColorFields
            material={groupState.material}
            shadeType={groupState.shadeType}
            shadeCode={groupState.shadeCode}
            onMaterialChange={handleMaterialChange}
            onShadeTypeChange={handleShadeTypeChange}
            onShadeCodeChange={handleShadeCodeChange}
            disabled={disabled}
            restorationType="puente"
            useZoneShading={groupState.useZoneShading}
            onUseZoneShadingChange={handleUseZoneShadingChange}
            cervicalShade={groupState.cervicalShade}
            medioShade={groupState.medioShade}
            incisalShade={groupState.incisalShade}
            onCervicalShadeChange={(v, inferred) => handleZoneShadeChange('cervicalShade', v, inferred)}
            onMedioShadeChange={(v, inferred) => handleZoneShadeChange('medioShade', v, inferred)}
            onIncisalShadeChange={(v, inferred) => handleZoneShadeChange('incisalShade', v, inferred)}
          />
        </div>

        {/* Mixed values warning */}
        {groupState.hasMixedValues && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <Icons.alertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Los puentes tienen valores diferentes. Editar sobrescribirá todos.</span>
          </div>
        )}
      </div>
    </div>
  );
}
