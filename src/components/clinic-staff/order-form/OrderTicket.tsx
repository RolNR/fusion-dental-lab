'use client';

import { useState } from 'react';
import { CaseType, RestorationType } from '@prisma/client';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import type { OrderFormState } from './OrderForm.types';
import type { ToothData } from '@/types/tooth';
import { useOrderValidation } from './useOrderValidation';
import {
  hasNonWarrantyMaterials,
  formatNonWarrantyMaterialsText,
} from '@/lib/materialWarrantyUtils';

const CASE_TYPE_LABELS: Record<CaseType, string> = {
  nuevo: 'Caso Nuevo',
  garantia: 'Solicitud de Garantía',
  regreso_prueba: 'Regreso de Prueba',
  reparacion_ajuste: 'Reparación o Ajuste',
};

const RESTORATION_TYPE_SHORT: Record<RestorationType, string> = {
  corona: 'Corona',
  puente: 'Puente',
  incrustacion: 'Incrust.',
  maryland: 'Maryland',
  carilla: 'Carilla',
  provisional: 'Provis.',
  pilar: 'Pilar',
  barra: 'Barra',
  hibrida: 'Híbrida',
  toronto: 'Toronto',
  removible: 'Remov.',
  parcial: 'Parcial',
  total: 'Total',
  sobredentadura: 'Sobredent.',
  encerado: 'Encerado',
  mockup: 'Mockup',
  guia_quirurgica: 'Guía Qx',
  prototipo: 'Prototipo',
  guarda_oclusal: 'Guarda',
};

interface OrderTicketProps {
  formData: OrderFormState & { teeth?: ToothData[] };
  upperFiles: File[];
  lowerFiles: File[];
  biteFiles: File[];
  photographFiles: File[];
  onScrollToSection: (sectionId: string) => void;
  onSubmit: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isSavingDraft: boolean;
  isValidating: boolean;
  canSubmit: boolean;
  orderId?: string;
}

export function OrderTicket({
  formData,
  upperFiles,
  lowerFiles,
  biteFiles,
  photographFiles,
  onScrollToSection,
  onSubmit,
  onSaveDraft,
  onCancel,
  isSubmitting,
  isSavingDraft,
  isValidating,
  canSubmit,
  orderId,
}: OrderTicketProps) {
  const validation = useOrderValidation({ formData, upperFiles, lowerFiles });

  // Warranty disclaimer state
  const requiresWarrantyAcceptance = hasNonWarrantyMaterials(formData.materialSent);
  const nonWarrantyText = formatNonWarrantyMaterialsText(formData.materialSent);
  const [warrantyAccepted, setWarrantyAccepted] = useState(false);

  const isGarantia = formData.tipoCaso === 'garantia';
  const isRepair =
    formData.tipoCaso === 'reparacion_ajuste' || formData.tipoCaso === 'regreso_prueba';

  const teethCount = formData.teeth?.length ?? 0;
  const materialsCount = formData.materialSent
    ? Object.values(formData.materialSent).filter(Boolean).length
    : 0;
  const totalScanFiles = upperFiles.length + lowerFiles.length + biteFiles.length;
  const totalPhotos = photographFiles.length;

  const submitDisabled =
    isSubmitting ||
    isSavingDraft ||
    isValidating ||
    validation.hasBlockingErrors ||
    (requiresWarrantyAcceptance && !warrantyAccepted);

  return (
    <aside
      aria-label="Resumen de orden"
      className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Icons.clipboardList className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Resumen de orden</h3>
        </div>
        {formData.isUrgent && (
          <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
            <Icons.zap className="h-3 w-3" />
            Urgente
          </span>
        )}
      </div>

      {/* Summary rows */}
      <div className="space-y-3 text-sm">
        {/* Case type */}
        <TicketRow
          label="Tipo de caso"
          missing={validation.isCaseTypeMissing}
          onFix={() => onScrollToSection('caseType')}
        >
          {formData.tipoCaso ? (
            <span className="font-medium text-foreground">
              {CASE_TYPE_LABELS[formData.tipoCaso]}
            </span>
          ) : (
            <MissingText>Sin seleccionar</MissingText>
          )}
        </TicketRow>

        {isGarantia && (
          <TicketRow
            label="Motivo de garantía"
            missing={validation.isWarrantyReasonMissing}
            onFix={() => onScrollToSection('caseType')}
          >
            {formData.motivoGarantia?.trim() ? (
              <span className="text-foreground">{formData.motivoGarantia}</span>
            ) : (
              <MissingText>Sin escribir</MissingText>
            )}
          </TicketRow>
        )}

        {/* Patient */}
        <TicketRow
          label="Paciente"
          missing={validation.isPatientNameMissing}
          onFix={() => onScrollToSection('patient')}
        >
          {formData.patientName?.trim() ? (
            <span className="font-medium text-foreground">{formData.patientName}</span>
          ) : (
            <MissingText>Sin nombre</MissingText>
          )}
        </TicketRow>

        <TicketRow
          label="Fecha de entrega"
          missing={validation.isDeliveryDateMissing}
          onFix={() => onScrollToSection('patient')}
        >
          {formData.fechaEntregaDeseada ? (
            <span className="text-foreground">{formData.fechaEntregaDeseada}</span>
          ) : (
            <MissingText>Sin fecha</MissingText>
          )}
        </TicketRow>

        {/* Teeth — hidden for warranty/repair cases */}
        {!isGarantia && !isRepair && (
          <TicketRow
            label="Dientes"
            missing={validation.isTeethMissing}
            onFix={() => onScrollToSection('teeth')}
          >
            {teethCount === 0 ? (
              <MissingText>Sin dientes configurados</MissingText>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="font-medium text-foreground">
                  {teethCount} {teethCount === 1 ? 'diente' : 'dientes'}
                </span>
                <ToothDetailList
                  teeth={formData.teeth ?? []}
                  onJump={() => onScrollToSection('teeth')}
                />
              </div>
            )}
          </TicketRow>
        )}

        {/* Anexos */}
        {!isGarantia && (
          <div className="border-t border-border pt-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Anexos y materiales
            </h4>
            <div className="space-y-2">
              <AnexoLine
                label="Materiales"
                countLabel={
                  materialsCount > 0 ? `${materialsCount} seleccionados` : undefined
                }
                onJump={() => onScrollToSection('anexos')}
              />
              <AnexoLine
                label="Escaneos"
                missing={validation.isScanMissingFiles}
                missingText={
                  validation.isScanMissingFiles
                    ? `Faltan: ${validation.scanMissingArches.join(' y ')}`
                    : undefined
                }
                onJump={() => onScrollToSection('anexos')}
              >
                <FilesList
                  groups={[
                    { label: 'Superior', files: upperFiles },
                    { label: 'Inferior', files: lowerFiles },
                    { label: 'Mordida', files: biteFiles },
                  ]}
                  onJump={() => onScrollToSection('anexos')}
                  totalFiles={totalScanFiles}
                />
              </AnexoLine>
              <AnexoLine
                label="Fotografías"
                onJump={() => onScrollToSection('anexos')}
              >
                <FilesList
                  groups={[{ label: 'Fotos', files: photographFiles }]}
                  onJump={() => onScrollToSection('anexos')}
                  totalFiles={totalPhotos}
                />
              </AnexoLine>
            </div>
          </div>
        )}

        {/* Submission type */}
        {!isGarantia && (formData.submissionType || formData.articulatedBy) && (
          <div className="border-t border-border pt-3">
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {formData.submissionType && (
                <span>
                  Entrega:{' '}
                  <span className="font-medium text-foreground">
                    {formData.submissionType === 'prueba' ? 'Prueba' : 'Terminado'}
                  </span>
                </span>
              )}
              {formData.articulatedBy && (
                <span>
                  Articulado por:{' '}
                  <span className="font-medium text-foreground">
                    {formData.articulatedBy === 'doctor' ? 'Doctor' : 'Laboratorio'}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Warranty disclaimer */}
      {requiresWarrantyAcceptance && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
          <div className="flex items-start gap-2">
            <Icons.alertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-foreground">Material sin garantía</p>
              <p className="mt-1 text-muted-foreground">
                No garantizamos resultados con: {nonWarrantyText}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <Checkbox
              label={
                <span className="text-xs font-medium text-foreground">
                  Acepto que no aplica garantía
                </span>
              }
              checked={warrantyAccepted}
              onChange={(e) => setWarrantyAccepted(e.target.checked)}
            />
          </div>
        </div>
      )}

      {/* Missing fields footer */}
      {validation.missingCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-danger/10 p-2 text-xs text-danger">
          <Icons.alertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Los campos en rojo son requeridos ({validation.missingCount}{' '}
            {validation.missingCount === 1 ? 'pendiente' : 'pendientes'})
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        {canSubmit && (
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            isLoading={isSubmitting || isValidating}
            disabled={submitDisabled}
            fullWidth
          >
            {isValidating ? 'Validando...' : orderId ? 'Guardar y Enviar' : 'Enviar al laboratorio'}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={onSaveDraft}
          isLoading={isSavingDraft}
          disabled={isSubmitting || isSavingDraft || isValidating}
          fullWidth
        >
          {orderId ? 'Guardar Cambios' : 'Guardar Borrador'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting || isSavingDraft || isValidating}
          fullWidth
        >
          Cancelar
        </Button>
      </div>
    </aside>
  );
}

// ---------- Subcomponents ----------

function TicketRow({
  label,
  missing,
  onFix,
  children,
}: {
  label: string;
  missing?: boolean;
  onFix?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-medium uppercase tracking-wide ${
            missing ? 'text-danger' : 'text-muted-foreground'
          }`}
        >
          {label}
        </span>
        {missing && onFix && (
          <button
            type="button"
            onClick={onFix}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Completar
          </button>
        )}
      </div>
      <div className={missing ? 'text-danger' : ''}>{children}</div>
    </div>
  );
}

function MissingText({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium italic text-danger">{children}</span>;
}

function AnexoLine({
  label,
  countLabel,
  missing,
  missingText,
  onJump,
  children,
}: {
  label: string;
  countLabel?: string;
  missing?: boolean;
  missingText?: string;
  onJump: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold ${
              missing ? 'text-danger' : 'text-foreground'
            }`}
          >
            {label}
          </span>
          {countLabel && (
            <span className="text-xs text-muted-foreground">· {countLabel}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onJump}
          className="text-xs font-medium text-primary hover:underline"
        >
          Agregar
        </button>
      </div>
      {missing && missingText && (
        <p className="mt-1 text-xs text-danger">{missingText}</p>
      )}
      {children}
    </div>
  );
}

function ToothDetailList({
  teeth,
  onJump,
}: {
  teeth: ToothData[];
  onJump: () => void;
}) {
  // Sort by tooth number for stable, readable order
  const sorted = [...teeth].sort((a, b) => {
    const an = parseInt(a.toothNumber, 10);
    const bn = parseInt(b.toothNumber, 10);
    return an - bn;
  });

  return (
    <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-muted/10">
      {sorted.map((tooth) => (
        <ToothDetailItem key={tooth.toothNumber} tooth={tooth} onJump={onJump} />
      ))}
    </ul>
  );
}

function ToothDetailItem({
  tooth,
  onJump,
}: {
  tooth: ToothData;
  onJump: () => void;
}) {
  const missing: string[] = [];
  if (!tooth.material) missing.push('material');
  if (!tooth.tipoRestauracion) missing.push('tipo');
  const isIncomplete = missing.length > 0;

  const restorationLabel = tooth.tipoRestauracion
    ? RESTORATION_TYPE_SHORT[tooth.tipoRestauracion]
    : null;

  const colorInfo = tooth.colorInfo as
    | {
        shadeCode?: string;
        useZoneShading?: boolean;
        cervicalShade?: string;
        medioShade?: string;
        incisalShade?: string;
      }
    | null
    | undefined;

  let colorLabel: string | null = null;
  if (colorInfo?.useZoneShading) {
    const parts = [
      colorInfo.cervicalShade,
      colorInfo.medioShade,
      colorInfo.incisalShade,
    ].filter(Boolean);
    if (parts.length > 0) colorLabel = parts.join('/');
  } else if (colorInfo?.shadeCode) {
    colorLabel = colorInfo.shadeCode;
  }

  return (
    <li>
      <button
        type="button"
        onClick={onJump}
        className="flex w-full items-start gap-2 px-2 py-2 text-left hover:bg-muted/30"
      >
        {/* Tooth number badge */}
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isIncomplete
              ? 'bg-danger/15 text-danger'
              : 'bg-primary/15 text-primary'
          }`}
        >
          {tooth.toothNumber}
        </span>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {restorationLabel && (
              <span className="font-semibold text-foreground">{restorationLabel}</span>
            )}
            {tooth.trabajoSobreImplante && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                <Icons.screw className="h-2.5 w-2.5" />
                implante
              </span>
            )}
          </div>
          {tooth.material && (
            <span className="truncate text-xs text-muted-foreground" title={tooth.material}>
              {tooth.material}
            </span>
          )}
          {colorLabel && (
            <span className="text-xs text-muted-foreground">Color: {colorLabel}</span>
          )}
          {isIncomplete && (
            <span className="flex items-center gap-1 text-xs font-medium text-danger">
              <Icons.alertCircle className="h-3 w-3 shrink-0" />
              Falta {missing.join(', ')}
            </span>
          )}
        </div>
      </button>
    </li>
  );
}

function FilesList({
  groups,
  onJump,
  totalFiles,
}: {
  groups: { label: string; files: File[] }[];
  onJump: () => void;
  totalFiles: number;
}) {
  if (totalFiles === 0) {
    return <p className="mt-1 text-xs italic text-muted-foreground">Sin archivos adjuntos</p>;
  }
  return (
    <ul className="mt-1 space-y-0.5">
      {groups.flatMap((group) =>
        group.files.map((file, idx) => (
          <li
            key={`${group.label}-${idx}-${file.name}`}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <Icons.file className="h-3 w-3 shrink-0" />
            <button
              type="button"
              onClick={onJump}
              className="truncate text-left hover:text-primary hover:underline"
              title={file.name}
            >
              {group.label}: {file.name}
            </button>
          </li>
        ))
      )}
    </ul>
  );
}
