'use client';

import { forwardRef } from 'react';
import { Select } from '@/components/ui/Select';
import { OcclusionInfo } from '@/types/order';
import {
  CollapsibleSubsection,
  FieldLabel,
  ToggleButtonGroup,
  ToggleOption,
} from '@/components/ui/form';

type OcclusionSectionProps = {
  oclusionDiseno?: OcclusionInfo;
  onChange: (value: OcclusionInfo | undefined) => void;
  errors?: {
    tipoOclusion?: string;
    espacioInteroclusalSuficiente?: string;
    solucionEspacioInsuficiente?: string;
  };
  hasErrors?: boolean;
  errorCount?: number;
};

type OcclusionType = 'normal' | 'clase_ii' | 'clase_iii' | 'mordida_cruzada';
type SpaceOption = 'yes' | 'no';

const OCCLUSION_TYPE_OPTIONS: ToggleOption<OcclusionType>[] = [
  { value: 'normal', label: 'Normal', icon: 'check' },
  { value: 'clase_ii', label: 'Mordida Profunda', icon: 'arrowDown' },
  { value: 'clase_iii', label: 'Mordida Abierta', icon: 'arrowUp' },
  { value: 'mordida_cruzada', label: 'Bruxismo', icon: 'zap' },
];

const SPACE_OPTIONS: ToggleOption<SpaceOption>[] = [
  { value: 'yes', label: 'Sí, Espacio Adecuado', icon: 'check' },
  { value: 'no', label: 'No, Espacio Limitado', icon: 'x' },
];

export const OcclusionSection = forwardRef<HTMLDivElement, OcclusionSectionProps>(
  ({ oclusionDiseno, onChange, errors }, ref) => {
    const handleFieldChange = (field: keyof OcclusionInfo, value: unknown) => {
      const updated = {
        ...oclusionDiseno,
        [field]: value,
      } as OcclusionInfo;

      // Clear solution field if space is sufficient
      if (field === 'espacioInteroclusalSuficiente' && value === true) {
        delete updated.solucionEspacioInsuficiente;
      }

      onChange(updated);
    };

    // Convert boolean to string for ToggleButtonGroup
    const spaceValue: SpaceOption | undefined =
      oclusionDiseno?.espacioInteroclusalSuficiente === true
        ? 'yes'
        : oclusionDiseno?.espacioInteroclusalSuficiente === false
          ? 'no'
          : undefined;

    return (
      <div ref={ref}>
        <CollapsibleSubsection icon="layers" title="Oclusión y Diseño">
          <div className="space-y-6">
            {/* Occlusion Type */}
            <div>
              <FieldLabel icon="layers" label="Tipo de Oclusión" required />
              <ToggleButtonGroup
                options={OCCLUSION_TYPE_OPTIONS}
                value={oclusionDiseno?.tipoOclusion as OcclusionType | undefined}
                onChange={(value) => handleFieldChange('tipoOclusion', value)}
                className="mt-2"
              />
              {errors?.tipoOclusion && (
                <p className="mt-2 text-sm text-danger font-medium">{errors.tipoOclusion}</p>
              )}
            </div>

            {/* Interocclusal Space Available */}
            <div>
              <FieldLabel label="¿Espacio Interoclusal Disponible?" required />
              <ToggleButtonGroup
                options={SPACE_OPTIONS}
                value={spaceValue}
                onChange={(value) =>
                  handleFieldChange('espacioInteroclusalSuficiente', value === 'yes')
                }
                className="mt-2"
              />
              {errors?.espacioInteroclusalSuficiente && (
                <p className="mt-2 text-sm text-danger font-medium">
                  {errors.espacioInteroclusalSuficiente}
                </p>
              )}
            </div>

            {/* Contact & Contour Preferences */}
            {oclusionDiseno?.espacioInteroclusalSuficiente === false && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <FieldLabel icon="settings" label="Preferencias de Contacto y Contorno" />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Contacto Proximal"
                    value={oclusionDiseno?.solucionEspacioInsuficiente || ''}
                    onChange={(e) =>
                      handleFieldChange(
                        'solucionEspacioInsuficiente',
                        e.target.value as OcclusionInfo['solucionEspacioInsuficiente']
                      )
                    }
                    error={errors?.solucionEspacioInsuficiente}
                  >
                    <option value="">Normal</option>
                    <option value="reduccion_oclusal">Ajustado</option>
                    <option value="aumento_vertical">Amplio</option>
                  </Select>

                  <Select label="Contacto Oclusal" defaultValue="">
                    <option value="">Normal</option>
                    <option value="heavy">Fuerte</option>
                    <option value="light">Ligero</option>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSubsection>
      </div>
    );
  }
);

OcclusionSection.displayName = 'OcclusionSection';
