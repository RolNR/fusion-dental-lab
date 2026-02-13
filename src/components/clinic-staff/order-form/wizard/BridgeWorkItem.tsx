'use client';

import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { BridgeDefinition } from '@/types/tooth';
import { ColorInfo } from '@/types/order';
import { ToothColorFields } from './ToothColorFields';

interface BridgeWorkItemProps {
  bridge: BridgeDefinition;
  onUpdate: (bridgeId: string, updates: Partial<BridgeDefinition>) => void;
  onRemove: (bridgeId: string) => void;
  disabled?: boolean;
}

export function BridgeWorkItem({
  bridge,
  onUpdate,
  onRemove,
  disabled = false,
}: BridgeWorkItemProps) {
  const handleMaterialChange = (value: string) => {
    onUpdate(bridge.id, { material: value || undefined });
  };

  const handleColorSystemChange = (value: string) => {
    onUpdate(bridge.id, {
      colorInfo: {
        ...bridge.colorInfo,
        shadeType: value || null,
      },
    });
  };

  const handleShadeChange = (value: string) => {
    onUpdate(bridge.id, {
      colorInfo: {
        ...bridge.colorInfo,
        shadeCode: value || null,
      },
    });
  };

  // Calculate total teeth in bridge (including pontics)
  const totalTeeth = 2 + bridge.pontics.length; // start + end + pontics

  return (
    <div className="flex flex-wrap items-center gap-2 py-3 px-3 bg-primary/5 rounded-lg border border-primary/20">
      {/* Bridge Info */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <Icons.copy className="h-4 w-4 text-primary" />
        <span className="font-bold text-primary">
          {bridge.startTooth}-{bridge.endTooth}
        </span>
        <span className="text-xs text-muted-foreground">({totalTeeth} dientes)</span>
      </div>

      <ToothColorFields
        material={bridge.material || ''}
        shadeType={bridge.colorInfo?.shadeType || ''}
        shadeCode={bridge.colorInfo?.shadeCode || ''}
        onMaterialChange={handleMaterialChange}
        onShadeTypeChange={handleColorSystemChange}
        onShadeCodeChange={handleShadeChange}
        disabled={disabled}
        restorationType="puente"
      />

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(bridge.id)}
        disabled={disabled}
        className="!p-1.5 !text-muted-foreground hover:!bg-danger/10 hover:!text-danger shrink-0"
        title="Quitar puente"
      >
        <Icons.x className="h-4 w-4" />
      </Button>
    </div>
  );
}
