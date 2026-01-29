'use client';

import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ToothData } from '@/types/tooth';
import { ColorInfo, ImplantInfo } from '@/types/order';
import { ToothColorFields } from './ToothColorFields';

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

      <ToothColorFields
        material={toothData.material || ''}
        shadeType={colorInfo?.shadeType || ''}
        shadeCode={colorInfo?.shadeCode || ''}
        onMaterialChange={handleMaterialChange}
        onShadeTypeChange={handleColorSystemChange}
        onShadeCodeChange={handleShadeChange}
        disabled={disabled}
      />

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
