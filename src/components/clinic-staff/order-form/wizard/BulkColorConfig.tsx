'use client';

import { useState, useMemo } from 'react';
import { RestorationType } from '@prisma/client';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ToothData, BridgeDefinition } from '@/types/tooth';
import { ToothColorFields } from './ToothColorFields';

interface BulkColorConfigProps {
  teethData: Map<string, ToothData>;
  bridges: BridgeDefinition[];
  onApplyToTeeth: (
    material: string,
    shadeType: string,
    shadeCode: string,
    filter: 'all' | RestorationType
  ) => void;
  onApplyToBridges: (material: string, shadeType: string, shadeCode: string) => void;
  disabled?: boolean;
}

const WORK_TYPE_LABELS: Record<RestorationType, string> = {
  corona: 'Coronas',
  puente: 'Puentes',
  inlay: 'Inlays',
  onlay: 'Onlays',
  carilla: 'Carillas',
  provisional: 'Provisionales',
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
    if (!material && !shadeType && !shadeCode) return;

    if (filter === 'all') {
      // Apply to all teeth and bridges
      onApplyToTeeth(material, shadeType, shadeCode, 'all');
      if (bridges.length > 0) {
        onApplyToBridges(material, shadeType, shadeCode);
      }
    } else if (filter === 'puente') {
      // Apply only to bridges
      onApplyToBridges(material, shadeType, shadeCode);
    } else {
      // Apply to specific work type
      onApplyToTeeth(material, shadeType, shadeCode, filter);
    }

    // Clear form after applying
    setMaterial('');
    setShadeType('');
    setShadeCode('');
  };

  const canApply = (material || shadeType || shadeCode) && totalAffected > 0;

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
            />
          </div>

          {/* Filter and Apply */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Aplicar a:</span>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | RestorationType)}
              disabled={disabled}
              className="text-sm flex-1 min-w-[150px]"
            >
              <option value="all">
                Todos los dientes (
                {Array.from(workTypeCounts.values()).reduce((a, b) => a + b, 0) + bridges.length})
              </option>
              {bridges.length > 0 && (
                <option value="puente">Solo Puentes ({bridges.length})</option>
              )}
              {Array.from(workTypeCounts.entries()).map(([workType, count]) => (
                <option key={workType} value={workType}>
                  Solo {WORK_TYPE_LABELS[workType]} ({count})
                </option>
              ))}
            </Select>
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
