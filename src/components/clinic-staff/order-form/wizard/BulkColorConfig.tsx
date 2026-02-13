'use client';

import { useState, useMemo } from 'react';
import { RestorationType } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ToothData, BridgeDefinition } from '@/types/tooth';
import { ToothColorFields } from './ToothColorFields';
import { getMaterialsForRestorationTypes } from '@/lib/materialsByRestoration';

interface ZoneShadingData {
  useZoneShading: boolean;
  cervicalShade: string;
  medioShade: string;
  incisalShade: string;
}

interface BulkColorConfigProps {
  teethData: Map<string, ToothData>;
  bridges: BridgeDefinition[];
  onApplyToTeeth: (
    material: string,
    shadeType: string,
    shadeCode: string,
    filter: 'all' | RestorationType,
    zoneShading?: ZoneShadingData
  ) => void;
  onApplyToBridges: (
    material: string,
    shadeType: string,
    shadeCode: string,
    zoneShading?: ZoneShadingData
  ) => void;
  disabled?: boolean;
}

const WORK_TYPE_LABELS: Record<RestorationType, string> = {
  // Restauraciones por diente
  corona: 'Coronas',
  puente: 'Puentes',
  incrustacion: 'Incrustaciones',
  maryland: 'Maryland',
  carilla: 'Carillas',
  provisional: 'Provisionales',
  // Sobre implantes
  pilar: 'Pilares',
  barra: 'Barras',
  hibrida: 'Híbridas',
  toronto: 'Toronto',
  // Prótesis removible
  removible: 'Removibles',
  parcial: 'Parciales',
  total: 'Totales',
  sobredentadura: 'Sobredentaduras',
  // Diagnóstico/Planificación
  encerado: 'Encerados',
  mockup: 'Mockups',
  guia_quirurgica: 'Guías Quirúrgicas',
  prototipo: 'Prototipos',
  guarda_oclusal: 'Guardas Oclusales',
};

export function BulkColorConfig({
  teethData,
  bridges,
  onApplyToTeeth,
  onApplyToBridges,
  disabled = false,
}: BulkColorConfigProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [material, setMaterial] = useState('');
  const [shadeType, setShadeType] = useState('');
  const [shadeCode, setShadeCode] = useState('');
  const [filter, setFilter] = useState<'all' | RestorationType>('all');
  const [useZoneShading, setUseZoneShading] = useState(false);
  const [cervicalShade, setCervicalShade] = useState('');
  const [medioShade, setMedioShade] = useState('');
  const [incisalShade, setIncisalShade] = useState('');

  // Calculate counts by work type (excluding bridge teeth)
  const workTypeCounts = useMemo(() => {
    const counts = new Map<RestorationType, number>();

    for (const [, data] of teethData) {
      if (!data.tipoRestauracion) continue;
      // Skip bridge teeth - bridges are handled separately via bridges array
      if (data.tipoRestauracion === 'puente') continue;

      const workType = data.tipoRestauracion;
      counts.set(workType, (counts.get(workType) || 0) + 1);
    }

    return counts;
  }, [teethData]);

  // Materials based on actual restoration types in the order
  const bulkMaterialOptions = useMemo(() => {
    const types: RestorationType[] = Array.from(workTypeCounts.keys());
    if (bridges.length > 0 && !types.includes('puente')) {
      types.push('puente');
    }
    if (filter !== 'all') {
      return undefined; // let ToothColorFields resolve from restorationType
    }
    return getMaterialsForRestorationTypes(types);
  }, [workTypeCounts, bridges.length, filter]);

  // Calculate total items that would be affected
  const totalAffected = useMemo(() => {
    if (filter === 'all') {
      let total = 0;
      workTypeCounts.forEach((count) => {
        total += count;
      });
      return total + bridges.length;
    } else if (filter === 'puente') {
      return bridges.length;
    } else {
      return workTypeCounts.get(filter) || 0;
    }
  }, [filter, workTypeCounts, bridges.length]);

  const hasAnyWork = workTypeCounts.size > 0 || bridges.length > 0;

  const handleApply = () => {
    const hasShadeData = useZoneShading ? cervicalShade || medioShade || incisalShade : shadeCode;
    if (!material && !shadeType && !hasShadeData) return;

    const zoneData: ZoneShadingData | undefined = useZoneShading
      ? { useZoneShading: true, cervicalShade, medioShade, incisalShade }
      : undefined;

    if (filter === 'all') {
      onApplyToTeeth(material, shadeType, shadeCode, 'all', zoneData);
      if (bridges.length > 0) {
        onApplyToBridges(material, shadeType, shadeCode, zoneData);
      }
    } else if (filter === 'puente') {
      onApplyToBridges(material, shadeType, shadeCode, zoneData);
    } else {
      onApplyToTeeth(material, shadeType, shadeCode, filter, zoneData);
    }

    // Clear form after applying
    setMaterial('');
    setShadeType('');
    setShadeCode('');
    setCervicalShade('');
    setMedioShade('');
    setIncisalShade('');
    setUseZoneShading(false);
  };

  const hasShadeInput = useZoneShading ? cervicalShade || medioShade || incisalShade : shadeCode;
  const canApply = (material || shadeType || hasShadeInput) && totalAffected > 0;

  if (!hasAnyWork) return null;

  return (
    <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 overflow-hidden">
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-500/10 transition-colors"
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <Icons.zap className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-foreground">Configuración Rápida</span>
        </div>
        <Icons.chevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3">
          <p className="text-xs text-muted-foreground">
            Configura el material y color una vez y aplícalo a múltiples dientes.
          </p>

          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                setMaterial('');
              }}
              disabled={disabled}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Todos (
              {Array.from(workTypeCounts.values()).reduce((a, b) => a + b, 0) + bridges.length})
            </button>
            {Array.from(workTypeCounts.entries()).map(([workType, count]) => (
              <button
                key={workType}
                type="button"
                onClick={() => {
                  setFilter(workType);
                  setMaterial('');
                }}
                disabled={disabled}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === workType
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {WORK_TYPE_LABELS[workType]} ({count})
              </button>
            ))}
            {bridges.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilter('puente');
                  setMaterial('');
                }}
                disabled={disabled}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === 'puente'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Puentes ({bridges.length})
              </button>
            )}
          </div>

          {/* Form Fields - using shared ToothColorFields component */}
          <div className="flex flex-wrap items-center gap-2">
            <ToothColorFields
              material={material}
              shadeType={shadeType}
              shadeCode={shadeCode}
              onMaterialChange={setMaterial}
              onShadeTypeChange={setShadeType}
              onShadeCodeChange={setShadeCode}
              disabled={disabled}
              restorationType={filter !== 'all' ? filter : undefined}
              materialOptions={bulkMaterialOptions}
              useZoneShading={useZoneShading}
              onUseZoneShadingChange={setUseZoneShading}
              cervicalShade={cervicalShade}
              medioShade={medioShade}
              incisalShade={incisalShade}
              onCervicalShadeChange={setCervicalShade}
              onMedioShadeChange={setMedioShade}
              onIncisalShadeChange={setIncisalShade}
            />
          </div>

          {/* Apply button */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApply}
              disabled={disabled || !canApply}
            >
              Aplicar{totalAffected > 0 ? ` (${totalAffected})` : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
