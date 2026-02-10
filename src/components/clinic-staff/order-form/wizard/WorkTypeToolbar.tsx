'use client';

import { useState } from 'react';
import { RestorationType, RestorationCategory } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface WorkTypeToolbarProps {
  activeTool: RestorationType | null;
  onToolChange: (tool: RestorationType | null, category?: RestorationCategory) => void;
  bridgeMode?: boolean;
  bridgeInstruction?: string;
  disabled?: boolean;
}

interface WorkTypeDefinition {
  id: RestorationType;
  label: string;
  icon: keyof typeof Icons;
  category: RestorationCategory;
}

interface CategoryDefinition {
  id: RestorationCategory;
  label: string;
  icon: keyof typeof Icons;
  color: string;
}

const CATEGORIES: CategoryDefinition[] = [
  { id: 'restauracion', label: 'Restauraciones', icon: 'crown', color: 'bg-primary' },
  { id: 'implante', label: 'Sobre implantes', icon: 'implant', color: 'bg-success' },
  { id: 'removible', label: 'Prótesis removible', icon: 'denture', color: 'bg-warning' },
  { id: 'diagnostico', label: 'Diagnóstico', icon: 'lightbulb', color: 'bg-info' },
];

const WORK_TYPES: WorkTypeDefinition[] = [
  // Restauraciones por diente
  { id: 'corona', label: 'Corona', icon: 'crown', category: 'restauracion' },
  { id: 'puente', label: 'Puente', icon: 'bridge', category: 'restauracion' },
  { id: 'inlay', label: 'Inlay', icon: 'inlay', category: 'restauracion' },
  { id: 'onlay', label: 'Onlay', icon: 'inlay', category: 'restauracion' },
  { id: 'carilla', label: 'Carilla', icon: 'veneer', category: 'restauracion' },
  { id: 'provisional', label: 'Provisional', icon: 'alertCircle', category: 'restauracion' },

  // Sobre implantes
  { id: 'pilar', label: 'Pilar/Abutment', icon: 'abutment', category: 'implante' },
  { id: 'barra', label: 'Barra', icon: 'bar', category: 'implante' },
  { id: 'hibrida', label: 'Híbrida', icon: 'hybrid', category: 'implante' },
  { id: 'toronto', label: 'Toronto', icon: 'hybrid', category: 'implante' },

  // Prótesis removible
  { id: 'removible', label: 'Removible', icon: 'denture', category: 'removible' },
  { id: 'parcial', label: 'Parcial', icon: 'denture', category: 'removible' },
  { id: 'total', label: 'Total', icon: 'denture', category: 'removible' },
  { id: 'sobredentadura', label: 'Sobredentadura', icon: 'denture', category: 'removible' },

  // Diagnóstico/Planificación
  { id: 'encerado', label: 'Encerado', icon: 'waxup', category: 'diagnostico' },
  { id: 'mockup', label: 'Mock-up', icon: 'mockup', category: 'diagnostico' },
  { id: 'guia_quirurgica', label: 'Guía quirúrgica', icon: 'surgicalGuide', category: 'diagnostico' },
  { id: 'prototipo', label: 'Prototipo', icon: 'cube', category: 'diagnostico' },
  { id: 'guarda_oclusal', label: 'Guarda oclusal', icon: 'guard', category: 'diagnostico' },
];

export function WorkTypeToolbar({
  activeTool,
  onToolChange,
  bridgeMode = false,
  bridgeInstruction,
  disabled = false,
}: WorkTypeToolbarProps) {
  const [expandedCategory, setExpandedCategory] = useState<RestorationCategory | null>(
    activeTool ? WORK_TYPES.find((w) => w.id === activeTool)?.category || null : null
  );

  const getToolClassName = (isActive: boolean) => {
    return isActive
      ? 'ring-2 ring-primary ring-offset-2'
      : '!bg-muted !text-foreground hover:!bg-muted/80 !shadow-none';
  };

  const getCategoryClassName = (category: CategoryDefinition, isExpanded: boolean) => {
    const hasActiveTool =
      activeTool && WORK_TYPES.find((w) => w.id === activeTool)?.category === category.id;

    if (hasActiveTool) {
      return 'ring-2 ring-offset-2 ring-primary';
    }
    if (isExpanded) {
      return `${category.color} text-white`;
    }
    return '!bg-muted !text-foreground hover:!bg-muted/80 !shadow-none';
  };

  const handleCategoryClick = (categoryId: RestorationCategory) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  const handleToolClick = (workType: WorkTypeDefinition) => {
    if (activeTool === workType.id) {
      onToolChange(null);
    } else {
      onToolChange(workType.id, workType.category);
    }
  };

  const workTypesInCategory = (categoryId: RestorationCategory) =>
    WORK_TYPES.filter((w) => w.category === categoryId);

  return (
    <div className="space-y-3">
      {/* Category buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((category) => {
          const Icon = Icons[category.icon];
          const isExpanded = expandedCategory === category.id;
          const typesInCategory = workTypesInCategory(category.id);
          const activeInCategory = activeTool
            ? typesInCategory.some((t) => t.id === activeTool)
            : false;

          return (
            <Button
              key={category.id}
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleCategoryClick(category.id)}
              disabled={disabled}
              className={getCategoryClassName(category, isExpanded)}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span>{category.label}</span>
              {activeInCategory && (
                <span className="ml-1 w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
              <Icons.chevronDown
                className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </Button>
          );
        })}
      </div>

      {/* Work types for expanded category */}
      {expandedCategory && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <span className="text-xs text-muted-foreground font-medium mr-2">
            {CATEGORIES.find((c) => c.id === expandedCategory)?.label}:
          </span>
          {workTypesInCategory(expandedCategory).map((workType) => {
            const Icon = Icons[workType.icon];
            const isActive = activeTool === workType.id;

            return (
              <Button
                key={workType.id}
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleToolClick(workType)}
                disabled={disabled}
                className={getToolClassName(isActive)}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                <span>{workType.label}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Active tool indicator */}
      {activeTool && !expandedCategory && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
          <Icons.check className="h-4 w-4 text-success" />
          <span className="text-sm text-muted-foreground">
            Herramienta activa:{' '}
            <strong className="text-foreground">
              {WORK_TYPES.find((w) => w.id === activeTool)?.label}
            </strong>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToolChange(null)}
            disabled={disabled}
            className="!p-1 !h-auto ml-auto"
          >
            <Icons.x className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Bridge mode instruction */}
      {bridgeMode && bridgeInstruction && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30">
          <Icons.info className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm text-primary font-medium">{bridgeInstruction}</span>
        </div>
      )}
    </div>
  );
}
