'use client';

import { useState } from 'react';
import { ProvisionalMaterial } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { ToothData } from '@/types/tooth';
import { ColorInfo, ImplantInfo } from '@/types/order';
import { ToothColorFields } from './ToothColorFields';

const PROVISIONAL_MATERIALS: { value: ProvisionalMaterial; label: string }[] = [
  { value: 'acrilico', label: 'Acrílico' },
  { value: 'bis_acrilico', label: 'Bis-acrílico' },
  { value: 'pmma', label: 'PMMA fresado' },
];

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
  const [showExtras, setShowExtras] = useState(
    toothData.solicitarProvisional || toothData.solicitarJig || false
  );

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

  const handleProvisionalChange = (checked: boolean) => {
    onUpdate(toothNumber, {
      solicitarProvisional: checked,
      materialProvisional: checked ? 'bis_acrilico' : undefined,
    });
  };

  const handleProvisionalMaterialChange = (value: string) => {
    onUpdate(toothNumber, {
      materialProvisional: value as ProvisionalMaterial,
    });
  };

  const handleJigChange = (checked: boolean) => {
    onUpdate(toothNumber, { solicitarJig: checked });
  };

  const colorInfo = toothData.colorInfo as ColorInfo | undefined;
  const implantInfo = toothData.informacionImplante as ImplantInfo | undefined;

  const hasExtras = toothData.solicitarProvisional || toothData.solicitarJig;

  return (
    <div className="py-2 px-3 bg-muted/30 rounded-lg space-y-2">
      {/* Main row */}
      <div className="flex flex-wrap items-center gap-2">
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

        {/* Extras toggle button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowExtras(!showExtras)}
          disabled={disabled}
          className={`!p-1.5 shrink-0 ${
            hasExtras
              ? '!text-primary !bg-primary/10'
              : '!text-muted-foreground hover:!text-primary'
          }`}
          title="Productos adicionales"
        >
          <Icons.filePlus className="h-4 w-4" />
        </Button>

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

      {/* Extras row - productos adicionales */}
      {showExtras && (
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50 ml-[58px]">
          {/* Provisional checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id={`provisional-${toothNumber}`}
              checked={toothData.solicitarProvisional || false}
              onChange={(e) => handleProvisionalChange(e.target.checked)}
              disabled={disabled}
              label="Provisional"
            />
            {toothData.solicitarProvisional && (
              <Select
                value={toothData.materialProvisional || 'bis_acrilico'}
                onChange={(e) => handleProvisionalMaterialChange(e.target.value)}
                disabled={disabled}
                className="!w-auto !min-w-[120px] !py-1 !text-sm"
              >
                {PROVISIONAL_MATERIALS.map((mat) => (
                  <option key={mat.value} value={mat.value}>
                    {mat.label}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Jig checkbox - solo si es implante */}
          {isImplante && (
            <Checkbox
              id={`jig-${toothNumber}`}
              checked={toothData.solicitarJig || false}
              onChange={(e) => handleJigChange(e.target.checked)}
              disabled={disabled}
              label="Jig de confirmación"
            />
          )}
        </div>
      )}
    </div>
  );
}
