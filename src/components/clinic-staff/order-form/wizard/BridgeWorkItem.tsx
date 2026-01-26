'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { BridgeDefinition } from '@/types/tooth';
import { ColorInfo, SHADE_SYSTEMS } from '@/types/order';

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
        <span className="text-xs text-muted-foreground">
          ({totalTeeth} dientes)
        </span>
      </div>

      {/* Material Input */}
      <div className="flex-1 min-w-[100px]">
        <Input
          value={bridge.material || ''}
          onChange={(e) => handleMaterialChange(e.target.value)}
          disabled={disabled}
          placeholder="Material"
          className="text-sm h-8"
        />
      </div>

      {/* Color System Select */}
      <div className="flex-1 min-w-[120px]">
        <Select
          value={bridge.colorInfo?.shadeType || ''}
          onChange={(e) => handleColorSystemChange(e.target.value)}
          disabled={disabled}
          className="text-sm h-8"
        >
          <option value="">Sistema</option>
          {SHADE_SYSTEMS.map((system) => (
            <option key={system.value} value={system.value}>
              {system.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Shade Code Input */}
      <div className="flex-1 min-w-[80px]">
        <Input
          value={bridge.colorInfo?.shadeCode || ''}
          onChange={(e) => handleShadeChange(e.target.value)}
          disabled={disabled}
          placeholder="Color"
          className="text-sm h-8"
        />
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(bridge.id)}
        disabled={disabled}
        className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors shrink-0"
        title="Quitar puente"
      >
        <Icons.x className="h-4 w-4" />
      </button>
    </div>
  );
}
