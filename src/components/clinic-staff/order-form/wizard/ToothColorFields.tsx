'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SHADE_SYSTEMS } from '@/types/order';

interface ToothColorFieldsProps {
  material: string;
  shadeType: string;
  shadeCode: string;
  onMaterialChange: (value: string) => void;
  onShadeTypeChange: (value: string) => void;
  onShadeCodeChange: (value: string) => void;
  disabled?: boolean;
}

export function ToothColorFields({
  material,
  shadeType,
  shadeCode,
  onMaterialChange,
  onShadeTypeChange,
  onShadeCodeChange,
  disabled = false,
}: ToothColorFieldsProps) {
  return (
    <>
      {/* Material Input */}
      <div className="flex-1 min-w-[100px]">
        <Input
          value={material}
          onChange={(e) => onMaterialChange(e.target.value)}
          disabled={disabled}
          placeholder="Material"
          className="text-sm !h-8 !py-1"
        />
      </div>

      {/* Color System Select */}
      <div className="flex-1 min-w-[120px]">
        <Select
          value={shadeType}
          onChange={(e) => onShadeTypeChange(e.target.value)}
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
          value={shadeCode}
          onChange={(e) => onShadeCodeChange(e.target.value)}
          disabled={disabled}
          placeholder="Color"
          className="text-sm !h-8 !py-1"
        />
      </div>
    </>
  );
}
