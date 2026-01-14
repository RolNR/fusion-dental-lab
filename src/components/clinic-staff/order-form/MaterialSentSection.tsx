'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Icons } from '@/components/ui/Icons';
import { SectionContainer, SectionHeader } from '@/components/ui/form';

type MaterialSentSectionProps = {
  materialSent?: Record<string, boolean>;
  onChange: (value: Record<string, boolean> | undefined) => void;
  errors?: {
    materialSent?: string;
  };
};

// Types for the category structure
type MaterialOption = {
  key: string;
  label: string;
  noGarantizado?: boolean;
  subOptions?: MaterialOption[];
};

type Category = {
  id: string;
  label: string;
  icon: keyof typeof Icons;
  options: MaterialOption[];
};

// Category and options configuration
const CATEGORIES: Category[] = [
  {
    id: 'impresiones',
    label: 'Impresiones',
    icon: 'layers',
    options: [
      { key: 'antagonista', label: 'Antagonista' },
      {
        key: 'arcada_completa',
        label: 'Arcada completa',
        subOptions: [
          { key: 'arcada_completa_metalica_rigida', label: 'Metálica rígida' },
          { key: 'arcada_completa_plastica_rigida', label: 'Plástica rígida' },
          { key: 'arcada_completa_aluminio', label: 'Aluminio', noGarantizado: true },
          { key: 'arcada_completa_personalizada', label: 'Personalizada' },
        ],
      },
      {
        key: 'parcial',
        label: 'Parcial',
        subOptions: [
          { key: 'parcial_metalica_rigida', label: 'Metálica rígida' },
          { key: 'parcial_plastica_rigida', label: 'Plástica rígida' },
          { key: 'parcial_aluminio', label: 'Aluminio', noGarantizado: true },
        ],
      },
      { key: 'cucharilla_doble', label: 'Cucharilla doble', noGarantizado: true },
    ],
  },
  {
    id: 'modelos',
    label: 'Modelos',
    icon: 'cube',
    options: [
      { key: 'modelo_solido', label: 'Modelo sólido' },
      { key: 'modelo_solido_reingreso', label: 'Modelo sólido (reingreso)' },
      { key: 'modelo_articulado', label: 'Modelo articulado' },
      { key: 'modelo_encerado_prototipo', label: 'Modelo con encerado / prototipo' },
    ],
  },
  {
    id: 'registros',
    label: 'Registros',
    icon: 'clipboardList',
    options: [
      { key: 'registro_mordida', label: 'Mordida' },
      { key: 'registro_oclusal', label: 'Oclusal' },
      { key: 'registro_silicon', label: 'Silicón' },
      { key: 'registro_cera', label: 'Cera', noGarantizado: true },
    ],
  },
  {
    id: 'archivos',
    label: 'Archivos',
    icon: 'folder',
    options: [
      { key: 'fotografia', label: 'Fotografía' },
      { key: 'radiografia', label: 'Radiografía' },
    ],
  },
];

// Tooltip component for "no garantizamos" items
function WarningTooltip() {
  return (
    <span className="group relative inline-flex ml-1.5 cursor-help">
      <Icons.alertCircle className="h-4 w-4 text-warning" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs rounded-lg bg-foreground px-3 py-2 text-xs text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50">
        No garantizamos resultados con este material
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
      </span>
    </span>
  );
}

// Category chip component
function CategoryChip({
  category,
  isActive,
  selectedCount,
  onClick,
}: {
  category: Category;
  isActive: boolean;
  selectedCount: number;
  onClick: () => void;
}) {
  const Icon = Icons[category.icon];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm
        transition-all duration-200 border-2
        ${
          isActive
            ? 'bg-primary text-primary-foreground border-primary shadow-md'
            : 'bg-muted/50 text-foreground border-border hover:border-primary/50 hover:bg-muted'
        }
      `}
    >
      <Icon className="h-4 w-4" />
      <span>{category.label}</span>
      {selectedCount > 0 && (
        <span
          className={`
            ml-1 px-2 py-0.5 text-xs rounded-full font-bold
            ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'}
          `}
        >
          {selectedCount}
        </span>
      )}
    </button>
  );
}

// Option checkbox with optional sub-options
function MaterialOptionItem({
  option,
  materialSent,
  onToggle,
  depth = 0,
}: {
  option: MaterialOption;
  materialSent: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
  depth?: number;
}) {
  const hasSubOptions = option.subOptions && option.subOptions.length > 0;
  const isExpanded = hasSubOptions && option.subOptions!.some((sub) => materialSent[sub.key]);
  const [showSubOptions, setShowSubOptions] = useState(isExpanded);

  const handleParentToggle = () => {
    if (hasSubOptions) {
      setShowSubOptions(!showSubOptions);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-border pl-4' : ''}`}>
      <div
        className={`
          flex items-center gap-2 p-3 rounded-lg transition-colors
          ${depth === 0 ? 'bg-muted/30 hover:bg-muted/50' : 'hover:bg-muted/30'}
        `}
      >
        {hasSubOptions ? (
          <button
            type="button"
            onClick={handleParentToggle}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <Icons.chevronRight
              className={`h-4 w-4 text-muted-foreground transition-transform ${showSubOptions ? 'rotate-90' : ''}`}
            />
            <span className="text-sm font-medium text-foreground">{option.label}</span>
          </button>
        ) : (
          <Checkbox
            label={option.label}
            checked={materialSent[option.key] === true}
            onChange={(e) => onToggle(option.key, e.target.checked)}
          />
        )}
        {option.noGarantizado && <WarningTooltip />}
      </div>

      {hasSubOptions && showSubOptions && (
        <div className="mt-2 space-y-2">
          {option.subOptions!.map((subOption) => (
            <MaterialOptionItem
              key={subOption.key}
              option={subOption}
              materialSent={materialSent}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Get all selected material labels for summary
function getSelectedMaterialLabels(materialSent: Record<string, boolean>): string[] {
  const labels: string[] = [];

  const findLabel = (options: MaterialOption[], key: string): string | null => {
    for (const option of options) {
      if (option.key === key) return option.label;
      if (option.subOptions) {
        const found = findLabel(option.subOptions, key);
        if (found) return found;
      }
    }
    return null;
  };

  for (const key of Object.keys(materialSent)) {
    if (materialSent[key]) {
      for (const category of CATEGORIES) {
        const label = findLabel(category.options, key);
        if (label) {
          labels.push(label);
          break;
        }
      }
    }
  }

  return labels;
}

// Count selected items in a category
function countSelectedInCategory(
  category: Category,
  materialSent: Record<string, boolean>
): number {
  let count = 0;

  const countOptions = (options: MaterialOption[]) => {
    for (const option of options) {
      if (materialSent[option.key]) count++;
      if (option.subOptions) countOptions(option.subOptions);
    }
  };

  countOptions(category.options);
  return count;
}

export function MaterialSentSection({ materialSent = {}, onChange, errors }: MaterialSentSectionProps) {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(() => {
    // Auto-expand categories that have selected items
    const active = new Set<string>();
    for (const category of CATEGORIES) {
      if (countSelectedInCategory(category, materialSent) > 0) {
        active.add(category.id);
      }
    }
    return active;
  });

  // Auto-expand categories when materialSent changes (e.g., from AI parsing)
  useEffect(() => {
    const categoriesToExpand = new Set<string>();
    for (const category of CATEGORIES) {
      if (countSelectedInCategory(category, materialSent) > 0) {
        categoriesToExpand.add(category.id);
      }
    }

    if (categoriesToExpand.size > 0) {
      setActiveCategories((prev) => {
        const next = new Set(prev);
        categoriesToExpand.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [materialSent]);

  const handleCategoryToggle = (categoryId: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleMaterialToggle = (key: string, checked: boolean) => {
    const updated = {
      ...materialSent,
      [key]: checked,
    };

    if (!checked) {
      delete updated[key];
    }

    const hasAnySelected = Object.values(updated).some((v) => v === true);
    onChange(hasAnySelected ? updated : undefined);
  };

  const selectedLabels = getSelectedMaterialLabels(materialSent);
  const totalSelected = selectedLabels.length;

  return (
    <SectionContainer>
      <SectionHeader
        icon="upload"
        title="Materiales Enviados"
        description="Selecciona los materiales que se enviarán al laboratorio"
      />

      <div className="space-y-6 p-6">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              isActive={activeCategories.has(category.id)}
              selectedCount={countSelectedInCategory(category, materialSent)}
              onClick={() => handleCategoryToggle(category.id)}
            />
          ))}
        </div>

        {/* Active category options */}
        {CATEGORIES.filter((cat) => activeCategories.has(cat.id)).map((category) => (
          <div
            key={category.id}
            className="rounded-xl border border-border bg-background p-4 shadow-sm"
          >
            <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              {(() => {
                const Icon = Icons[category.icon];
                return <Icon className="h-4 w-4 text-primary" />;
              })()}
              {category.label}
            </h4>
            <div className="space-y-2">
              {category.options.map((option) => (
                <MaterialOptionItem
                  key={option.key}
                  option={option}
                  materialSent={materialSent}
                  onToggle={handleMaterialToggle}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Summary */}
        {totalSelected > 0 && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-3">
              <Icons.check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {totalSelected} material{totalSelected !== 1 ? 'es' : ''} seleccionado
                  {totalSelected !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedLabels.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {errors?.materialSent && (
          <p className="text-sm text-danger font-medium">{errors.materialSent}</p>
        )}
      </div>
    </SectionContainer>
  );
}
