'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { SHADE_SYSTEMS } from '@/types/order';
import { inferShadeSystem } from '@/lib/shadeSystemLookup';
import type { RestorationType } from '@prisma/client';
import { getMaterialsForRestoration } from '@/lib/materialsByRestoration';

interface ToothColorFieldsProps {
  material: string;
  shadeType: string;
  shadeCode: string;
  onMaterialChange: (value: string) => void;
  onShadeTypeChange: (value: string) => void;
  onShadeCodeChange: (value: string) => void;
  disabled?: boolean;
  /** Restoration type — used to populate material dropdown */
  restorationType?: RestorationType | null;
  /** Override material options (takes priority over restorationType lookup) */
  materialOptions?: string[];
  // Zone shading props
  useZoneShading?: boolean;
  onUseZoneShadingChange?: (value: boolean) => void;
  cervicalShade?: string;
  medioShade?: string;
  incisalShade?: string;
  onCervicalShadeChange?: (value: string) => void;
  onMedioShadeChange?: (value: string) => void;
  onIncisalShadeChange?: (value: string) => void;
}

export function ToothColorFields({
  material,
  shadeType,
  shadeCode,
  onMaterialChange,
  onShadeTypeChange,
  onShadeCodeChange,
  disabled = false,
  restorationType,
  materialOptions,
  useZoneShading = false,
  onUseZoneShadingChange,
  cervicalShade = '',
  medioShade = '',
  incisalShade = '',
  onCervicalShadeChange,
  onMedioShadeChange,
  onIncisalShadeChange,
}: ToothColorFieldsProps) {
  const handleShadeCodeWithInference = (value: string) => {
    onShadeCodeChange(value);
    if (!shadeType && value) {
      const inferred = inferShadeSystem(value);
      if (inferred) {
        onShadeTypeChange(inferred);
      }
    }
  };

  const handleZoneShadeWithInference = (
    value: string,
    onChange: ((v: string) => void) | undefined
  ) => {
    onChange?.(value);
    if (!shadeType && value) {
      const inferred = inferShadeSystem(value);
      if (inferred) {
        onShadeTypeChange(inferred);
      }
    }
  };

  const availableMaterials = materialOptions ?? getMaterialsForRestoration(restorationType);
  const hasMaterialOptions = availableMaterials.length > 0;

  return (
    <>
      {/* Material - dropdown if options available, text input as fallback */}
      <div className="flex-1 min-w-[100px]">
        {hasMaterialOptions ? (
          <Select
            value={material}
            onChange={(e) => onMaterialChange(e.target.value)}
            disabled={disabled}
            className="text-sm !h-8 !py-1"
          >
            <option value="">Material</option>
            {availableMaterials.map((mat) => (
              <option key={mat} value={mat}>
                {mat}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            value={material}
            onChange={(e) => onMaterialChange(e.target.value)}
            disabled={disabled}
            placeholder="Material"
            className="text-sm !h-8 !py-1"
          />
        )}
      </div>

      {/* Zone shading toggle + shade inputs */}
      {useZoneShading ? (
        <div className="flex items-center gap-1 flex-1 min-w-[200px]">
          <Input
            value={cervicalShade}
            onChange={(e) =>
              handleZoneShadeWithInference(e.target.value, onCervicalShadeChange)
            }
            disabled={disabled}
            placeholder="Cervical"
            className="text-sm !h-8 !py-1"
            title="Tono cervical"
          />
          <Input
            value={medioShade}
            onChange={(e) =>
              handleZoneShadeWithInference(e.target.value, onMedioShadeChange)
            }
            disabled={disabled}
            placeholder="Medio"
            className="text-sm !h-8 !py-1"
            title="Tono medio"
          />
          <Input
            value={incisalShade}
            onChange={(e) =>
              handleZoneShadeWithInference(e.target.value, onIncisalShadeChange)
            }
            disabled={disabled}
            placeholder="Incisal"
            className="text-sm !h-8 !py-1"
            title="Tono incisal"
          />
        </div>
      ) : (
        <div className="flex-1 min-w-[80px]">
          <Input
            value={shadeCode}
            onChange={(e) => handleShadeCodeWithInference(e.target.value)}
            disabled={disabled}
            placeholder="Color"
            className="text-sm !h-8 !py-1"
          />
        </div>
      )}

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

      {/* Zone toggle button with icon */}
      {onUseZoneShadingChange && (
        <button
          type="button"
          onClick={() => onUseZoneShadingChange(!useZoneShading)}
          disabled={disabled}
          className={`shrink-0 p-1.5 rounded-md border transition-colors ${
            useZoneShading
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-border-input'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={useZoneShading ? 'Cambiar a tono único' : 'Tonos por zona (cervical, medio, incisal)'}
        >
          <Icons.toothZones className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
