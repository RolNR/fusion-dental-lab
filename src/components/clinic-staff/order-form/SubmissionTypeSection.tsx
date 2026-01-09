'use client';

import { SubmissionType, ArticulatedBy } from '@prisma/client';
import { Radio } from '@/components/ui/Radio';

type SubmissionTypeSectionProps = {
  submissionType?: SubmissionType;
  articulatedBy?: ArticulatedBy;
  onChange: (field: string, value: string | undefined) => void;
  errors?: {
    submissionType?: string;
    articulatedBy?: string;
  };
};

export function SubmissionTypeSection({
  submissionType,
  articulatedBy,
  onChange,
  errors,
}: SubmissionTypeSectionProps) {
  return (
    <div className="space-y-6">
      {/* Submission Type */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Tipo de Entrega
        </h3>
        <div className="space-y-3">
          <Radio
            name="submissionType"
            value="prueba_estructura"
            checked={submissionType === 'prueba_estructura'}
            onChange={(e) => onChange('submissionType', e.target.value)}
            label="Prueba de Estructura"
          />

          <Radio
            name="submissionType"
            value="prueba_estetica"
            checked={submissionType === 'prueba_estetica'}
            onChange={(e) => onChange('submissionType', e.target.value)}
            label="Prueba Estética"
          />

          <Radio
            name="submissionType"
            value="terminado"
            checked={submissionType === 'terminado' || !submissionType}
            onChange={(e) => onChange('submissionType', e.target.value)}
            label="Terminado"
          />
        </div>
        {errors?.submissionType && (
          <p className="mt-2 text-sm text-danger font-medium">{errors.submissionType}</p>
        )}
      </div>

      {/* Articulated By */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Articulado Por
        </h3>
        <div className="space-y-3">
          <Radio
            name="articulatedBy"
            value="doctor"
            checked={articulatedBy === 'doctor' || !articulatedBy}
            onChange={(e) => onChange('articulatedBy', e.target.value)}
            label="Doctor"
          />

          <Radio
            name="articulatedBy"
            value="laboratorio"
            checked={articulatedBy === 'laboratorio'}
            onChange={(e) => onChange('articulatedBy', e.target.value)}
            label="Laboratorio"
          />
        </div>
        {errors?.articulatedBy && (
          <p className="mt-2 text-sm text-danger font-medium">{errors.articulatedBy}</p>
        )}
      </div>
    </div>
  );
}
