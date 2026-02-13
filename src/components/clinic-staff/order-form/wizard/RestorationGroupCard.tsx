'use client';

import { useMemo, useCallback } from 'react';
import type { RestorationType } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ToothData } from '@/types/tooth';
import { ColorInfo } from '@/types/order';
import { InitialToothStatesMap } from '@/types/initial-tooth-state';
import { ToothColorFields } from './ToothColorFields';
import { WORK_TYPE_LABELS } from './AssignedWorkList';
import { deriveGroupState } from './groupConsensus';

interface RestorationGroupCardProps {
  restorationType: RestorationType;
  teeth: ToothData[];
  initialStates: InitialToothStatesMap;
  onBulkToothUpdate: (updates: Map<string, Partial<ToothData>>) => void;
  onToothRemove: (toothNumber: string) => void;
  disabled?: boolean;
}

export function RestorationGroupCard({
  restorationType,
  teeth,
  initialStates,
  onBulkToothUpdate,
  onToothRemove,
  disabled = false,
}: RestorationGroupCardProps) {
  // Derive consensus state from all teeth in the group
  const groupState = useMemo(
    () =>
      deriveGroupState(
        teeth.map((t) => t.material),
        teeth.map((t) => t.colorInfo as ColorInfo | undefined)
      ),
    [teeth]
  );

  // Build bulk updates for all teeth in the group
  const buildBulkUpdates = useCallback(
    (updates: Partial<ToothData>) => {
      const bulkUpdates = new Map<string, Partial<ToothData>>();
      for (const tooth of teeth) {
        bulkUpdates.set(tooth.toothNumber, updates);
      }
      return bulkUpdates;
    },
    [teeth]
  );

  const handleMaterialChange = useCallback(
    (value: string) => {
      onBulkToothUpdate(buildBulkUpdates({ material: value || undefined }));
    },
    [buildBulkUpdates, onBulkToothUpdate]
  );

  const handleShadeTypeChange = useCallback(
    (value: string) => {
      const bulkUpdates = new Map<string, Partial<ToothData>>();
      for (const tooth of teeth) {
        const currentColor = tooth.colorInfo as ColorInfo | undefined;
        bulkUpdates.set(tooth.toothNumber, {
          colorInfo: {
            ...currentColor,
            shadeType: value || null,
          },
        });
      }
      onBulkToothUpdate(bulkUpdates);
    },
    [teeth, onBulkToothUpdate]
  );

  const handleShadeCodeChange = useCallback(
    (value: string) => {
      const bulkUpdates = new Map<string, Partial<ToothData>>();
      for (const tooth of teeth) {
        const currentColor = tooth.colorInfo as ColorInfo | undefined;
        bulkUpdates.set(tooth.toothNumber, {
          colorInfo: {
            ...currentColor,
            shadeCode: value || null,
          },
        });
      }
      onBulkToothUpdate(bulkUpdates);
    },
    [teeth, onBulkToothUpdate]
  );

  const handleUseZoneShadingChange = useCallback(
    (value: boolean) => {
      const bulkUpdates = new Map<string, Partial<ToothData>>();
      for (const tooth of teeth) {
        const currentColor = tooth.colorInfo as ColorInfo | undefined;
        bulkUpdates.set(tooth.toothNumber, {
          colorInfo: {
            ...currentColor,
            useZoneShading: value,
            ...(value
              ? { shadeCode: null }
              : { cervicalShade: null, medioShade: null, incisalShade: null }),
          },
        });
      }
      onBulkToothUpdate(bulkUpdates);
    },
    [teeth, onBulkToothUpdate]
  );

  const handleZoneShadeChange = useCallback(
    (zone: 'cervicalShade' | 'medioShade' | 'incisalShade', value: string) => {
      const bulkUpdates = new Map<string, Partial<ToothData>>();
      for (const tooth of teeth) {
        const currentColor = tooth.colorInfo as ColorInfo | undefined;
        bulkUpdates.set(tooth.toothNumber, {
          colorInfo: {
            ...currentColor,
            [zone]: value || null,
          },
        });
      }
      onBulkToothUpdate(bulkUpdates);
    },
    [teeth, onBulkToothUpdate]
  );

  return (
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      {/* Group Header */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <Icons.tooth className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground text-sm">
            {WORK_TYPE_LABELS[restorationType]} ({teeth.length})
          </span>
        </div>

        {/* Tooth number badges */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {teeth.map((tooth) => {
            const isImplante = initialStates[tooth.toothNumber] === 'IMPLANTE';
            return (
              <span
                key={tooth.toothNumber}
                className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs pl-2 pr-1 py-0.5"
              >
                {tooth.toothNumber}
                {isImplante && <Icons.implant className="h-3 w-3" />}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onToothRemove(tooth.toothNumber)}
                  disabled={disabled}
                  className="!p-0 !h-4 !w-4 !min-h-0 !text-primary/60 hover:!text-danger hover:!bg-transparent"
                  title={`Quitar diente ${tooth.toothNumber}`}
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
            restorationType={restorationType}
            useZoneShading={groupState.useZoneShading}
            onUseZoneShadingChange={handleUseZoneShadingChange}
            cervicalShade={groupState.cervicalShade}
            medioShade={groupState.medioShade}
            incisalShade={groupState.incisalShade}
            onCervicalShadeChange={(v) => handleZoneShadeChange('cervicalShade', v)}
            onMedioShadeChange={(v) => handleZoneShadeChange('medioShade', v)}
            onIncisalShadeChange={(v) => handleZoneShadeChange('incisalShade', v)}
          />
        </div>

        {/* Mixed values warning */}
        {groupState.hasMixedValues && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <Icons.alertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Los dientes tienen valores diferentes. Editar sobrescribirá todos.</span>
          </div>
        )}
      </div>
    </div>
  );
}
