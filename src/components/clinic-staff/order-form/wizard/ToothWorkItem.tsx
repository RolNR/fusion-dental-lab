'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { ToothData } from '@/types/tooth';
import { ColorInfo, ImplantInfo, SHADE_SYSTEMS } from '@/types/order';

interface ToothWorkItemProps {
  toothNumber: string;
  toothData: ToothData;
  onUpdate: (toothNumber: string, updates: Partial<ToothData>) => void;
  onRemove: (toothNumber: string) => void;
  disabled?: boolean;
  isImplante?: boolean;
}

export function ToothWorkItem({
  toothNumber,
  toothData,
  onUpdate,
  onRemove,
  disabled = false,
  isImplante = false,
}: ToothWorkItemProps) {
  const handleMaterialChange = (value: string) => {
    onUpdate(toothNumber, { material: value || undefined });
  };

  const handleColorSystemChange = (value: string) => {
    const currentColor = toothData.colorInfo as ColorInfo | undefined;
    onUpdate(toothNumber, {
      colorInfo: {
        ...currentColor,
        shadeType: value || null,
      },
    });
  };

  const handleShadeChange = (value: string) => {
    const currentColor = toothData.colorInfo as ColorInfo | undefined;
    onUpdate(toothNumber, {
      colorInfo: {
        ...currentColor,
        shadeCode: value || null,
      },
    });
  };

  const colorInfo = toothData.colorInfo as ColorInfo | undefined;
  const implantInfo = toothData.informacionImplante as ImplantInfo | undefined;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-muted/30 rounded-lg">
      {/* Tooth Number */}
      <div className="flex items-center gap-1 min-w-[50px]">
        <span className="font-bold text-primary">#{toothNumber}</span>
        {isImplante && (
          <span title={`Implante: ${implantInfo?.marcaImplante || 'Sin marca'}`}>
            <Icons.implant className="h-3 w-3 text-primary" />
          </span>
        )}
      </div>

      {/* Material Input */}
      <div className="flex-1 min-w-[100px]">
        <Input
          value={toothData.material || ''}
          onChange={(e) => handleMaterialChange(e.target.value)}
          disabled={disabled}
          placeholder="Material"
          className="text-sm !h-8 !py-1"
        />
      </div>

      {/* Color System Select */}
      <div className="flex-1 min-w-[120px]">
        <Select
          value={colorInfo?.shadeType || ''}
          onChange={(e) => handleColorSystemChange(e.target.value)}
          disabled={disabled}
          className="text-sm !h-8 !py-1"
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
          value={colorInfo?.shadeCode || ''}
          onChange={(e) => handleShadeChange(e.target.value)}
          disabled={disabled}
          placeholder="Color"
          className="text-sm !h-8 !py-1"
        />
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(toothNumber)}
        disabled={disabled}
        className="!p-1.5 !text-muted-foreground hover:!bg-danger/10 hover:!text-danger shrink-0"
        title="Quitar trabajo"
      >
        <Icons.x className="h-4 w-4" />
      </Button>
    </div>
  );
}
