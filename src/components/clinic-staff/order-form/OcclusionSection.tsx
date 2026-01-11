'use client';

import { Select } from '@/components/ui/Select';
import { OcclusionInfo } from '@/types/order';
import { SectionContainer, SectionHeader, ButtonCard, FieldLabel } from '@/components/ui/form';

type OcclusionSectionProps = {
  oclusionDiseno?: OcclusionInfo;
  onChange: (value: OcclusionInfo | undefined) => void;
  errors?: {
    tipoOclusion?: string;
    espacioInteroclusalSuficiente?: string;
    solucionEspacioInsuficiente?: string;
  };
};

export function OcclusionSection({ oclusionDiseno, onChange, errors }: OcclusionSectionProps) {
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

  const occlusionTypes = [
    { value: 'normal', label: 'Normal', subtitle: 'Clase I', icon: 'check' as const },
    {
      value: 'clase_ii',
      label: 'Mordida Profunda',
      subtitle: 'Sobremordida',
      icon: 'arrowDown' as const,
    },
    {
      value: 'clase_iii',
      label: 'Mordida Abierta',
      subtitle: 'Espacio anterior',
      icon: 'arrowUp' as const,
    },
    {
      value: 'mordida_cruzada',
      label: 'Bruxismo',
      subtitle: 'Rechinamiento',
      icon: 'zap' as const,
    },
  ];

  return (
    <SectionContainer>
      <SectionHeader
        icon="layers"
        title="Oclusión y Diseño"
        description="Relación de mordida y diseño funcional"
        required
      />

      <div className="space-y-6 p-6">
        {/* Occlusion Type */}
        <div>
          <FieldLabel icon="layers" label="Tipo de Oclusión" required />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {occlusionTypes.map((type) => (
              <ButtonCard
                key={type.value}
                icon={type.icon}
                title={type.label}
                subtitle={type.subtitle}
                selected={oclusionDiseno?.tipoOclusion === type.value}
                onClick={() => handleFieldChange('tipoOclusion', type.value)}
              />
            ))}
          </div>
          {errors?.tipoOclusion && (
            <p className="mt-2 text-sm text-danger font-medium">{errors.tipoOclusion}</p>
          )}
        </div>

        {/* Interocclusal Space Available */}
        <div>
          <FieldLabel label="¿Espacio Interoclusal Disponible?" required />
          <div className="grid grid-cols-2 gap-3">
            <ButtonCard
              icon="check"
              title="Sí, Espacio Adecuado"
              subtitle="Espacio suficiente para restauración"
              selected={oclusionDiseno?.espacioInteroclusalSuficiente === true}
              onClick={() => handleFieldChange('espacioInteroclusalSuficiente', true)}
            />
            <ButtonCard
              icon="x"
              title="No, Espacio Limitado"
              subtitle="Se necesitan consideraciones especiales"
              selected={oclusionDiseno?.espacioInteroclusalSuficiente === false}
              onClick={() => handleFieldChange('espacioInteroclusalSuficiente', false)}
            />
          </div>
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
    </SectionContainer>
  );
}
