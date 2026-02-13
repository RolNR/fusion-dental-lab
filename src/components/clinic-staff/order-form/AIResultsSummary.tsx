'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import type { AISuggestion } from '@/types/ai-suggestions';

interface AIResultsSummaryProps {
  confirmedValues: Record<string, unknown>;
  suggestions: AISuggestion[];
  onFollowUp: (prompt: string) => void;
  onApply: () => void;
  onStartOver: () => void;
  isProcessing: boolean;
  speechSupported: boolean;
  isListening: boolean;
  onToggleSpeechRecognition: () => void;
}

/** Labels for known order-level fields */
const FIELD_LABELS: Record<string, string> = {
  patientName: 'Paciente',
  patientId: 'ID Paciente',
  fechaEntregaDeseada: 'Fecha de Entrega',
  description: 'Descripción',
  notes: 'Notas',
  tipoCaso: 'Tipo de Caso',
  motivoGarantia: 'Motivo Garantía',
  isDigitalScan: 'Escaneo Digital',
  escanerUtilizado: 'Escáner',
  submissionType: 'Tipo de Envío',
  articulatedBy: 'Articulado por',
  isUrgent: 'Urgente',
  teethNumbers: 'Dientes',
};

/** Tipo de restauración labels */
const RESTORATION_LABELS: Record<string, string> = {
  corona: 'Corona',
  puente: 'Puente',
  incrustacion: 'Incrustación',
  maryland: 'Maryland',
  carilla: 'Carilla',
  provisional: 'Provisional',
  pilar: 'Pilar/Abutment',
  barra: 'Barra',
  hibrida: 'Híbrida',
  toronto: 'Toronto',
  removible: 'Removible',
  parcial: 'Parcial',
  total: 'Total',
  sobredentadura: 'Sobredentadura',
  encerado: 'Encerado',
  mockup: 'Mock-up',
  guia_quirurgica: 'Guía Quirúrgica',
  prototipo: 'Prototipo',
  guarda_oclusal: 'Guarda Oclusal',
};

/** Required fields for a complete order */
const REQUIRED_FIELDS = ['patientName', 'teethNumbers'];

function formatValue(value: unknown): string {
  if (value === true) return 'Sí';
  if (value === false) return 'No';
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

interface FieldDisplayItem {
  label: string;
  value: string;
  filled: boolean;
}

function extractDisplayFields(values: Record<string, unknown>): FieldDisplayItem[] {
  const items: FieldDisplayItem[] = [];

  // Order-level fields
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const value = values[key];
    const formatted = formatValue(value);
    items.push({
      label,
      value: formatted,
      filled: formatted !== '' && value !== null && value !== undefined,
    });
  }

  // Teeth summary
  const teeth = values.teeth;
  if (Array.isArray(teeth) && teeth.length > 0) {
    // Remove the generic teethNumbers entry if we have detailed teeth
    const teethIdx = items.findIndex((i) => i.label === 'Dientes');
    if (teethIdx !== -1) {
      const toothNumbers = teeth.map((t) => t.toothNumber).join(', ');
      items[teethIdx] = {
        label: `Dientes (${teeth.length})`,
        value: toothNumbers,
        filled: true,
      };
    }

    // Per-tooth details
    for (const tooth of teeth) {
      const details: string[] = [];
      if (tooth.tipoRestauracion) {
        details.push(RESTORATION_LABELS[tooth.tipoRestauracion] || tooth.tipoRestauracion);
      }
      if (tooth.material) {
        details.push(tooth.material);
      }
      if (tooth.colorInfo?.useZoneShading) {
        const zones: string[] = [];
        if (tooth.colorInfo.cervicalShade) zones.push(`C:${tooth.colorInfo.cervicalShade}`);
        if (tooth.colorInfo.medioShade) zones.push(`M:${tooth.colorInfo.medioShade}`);
        if (tooth.colorInfo.incisalShade) zones.push(`I:${tooth.colorInfo.incisalShade}`);
        if (zones.length > 0) details.push(`Color: ${zones.join(' ')}`);
      } else if (tooth.colorInfo?.shadeCode) {
        details.push(`Color: ${tooth.colorInfo.shadeCode}`);
      }
      if (tooth.trabajoSobreImplante) {
        details.push('Implante');
      }
      if (tooth.solicitarProvisional) {
        details.push('Provisional');
      }
      if (tooth.solicitarJig) {
        details.push('Jig');
      }

      if (details.length > 0) {
        items.push({
          label: `  Diente ${tooth.toothNumber}`,
          value: details.join(' · '),
          filled: true,
        });
      }
    }
  }

  // Occlusion info
  const occlusion = values.oclusionDiseno as Record<string, unknown> | undefined;
  if (occlusion?.tipoOclusion) {
    items.push({
      label: 'Tipo de Oclusión',
      value: formatValue(occlusion.tipoOclusion),
      filled: true,
    });
  }

  return items;
}

function getMissingSuggestionFields(suggestions: AISuggestion[]): FieldDisplayItem[] {
  return suggestions
    .filter((s) => s.value === null || s.value === undefined)
    .map((s) => ({
      label: s.label,
      value: s.reason,
      filled: false,
    }));
}

export function AIResultsSummary({
  confirmedValues,
  suggestions,
  onFollowUp,
  onApply,
  onStartOver,
  isProcessing,
  speechSupported,
  isListening,
  onToggleSpeechRecognition,
}: AIResultsSummaryProps) {
  const [followUpText, setFollowUpText] = useState('');

  const displayFields = extractDisplayFields(confirmedValues);
  const missingFields = getMissingSuggestionFields(suggestions);

  // Determine if any required fields are missing
  const filledFieldKeys = new Set(
    Object.entries(confirmedValues)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k]) => k)
  );

  // Check teeth (either teethNumbers or teeth array)
  const hasTeeth =
    filledFieldKeys.has('teethNumbers') ||
    (Array.isArray(confirmedValues.teeth) && confirmedValues.teeth.length > 0);

  const missingRequired = REQUIRED_FIELDS.filter((f) => {
    if (f === 'teethNumbers') return !hasTeeth;
    return !filledFieldKeys.has(f);
  });

  const handleFollowUp = () => {
    if (followUpText.trim()) {
      onFollowUp(followUpText.trim());
      setFollowUpText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && followUpText.trim()) {
      e.preventDefault();
      handleFollowUp();
    }
  };

  // Only show filled fields + missing required ones
  const filledItems = displayFields.filter((item) => item.filled);
  const missingItems = [
    ...displayFields.filter(
      (item) => !item.filled && REQUIRED_FIELDS.some((rf) => FIELD_LABELS[rf] === item.label)
    ),
    ...missingFields,
  ];

  // Deduplicate missing items by label
  const seenLabels = new Set<string>();
  const uniqueMissingItems = missingItems.filter((item) => {
    if (seenLabels.has(item.label)) return false;
    seenLabels.add(item.label);
    return true;
  });

  return (
    <div className="ai-prompt-container-border">
      <div className="ai-prompt-container-inner p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="rounded-full p-2"
            style={{ backgroundColor: 'rgb(var(--ai-prompt-icon-bg-rgb))' }}
          >
            <Icons.lightbulb
              className="h-5 w-5"
              style={{ color: 'rgb(var(--ai-prompt-icon-rgb))' }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Resumen de la Orden</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Revisa la información extraída. Puedes agregar más detalles o aplicar al formulario.
            </p>
          </div>
        </div>

        {/* Confirmed fields */}
        <div className="space-y-1.5 mb-4">
          {filledItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <Icons.check className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span className="font-medium text-foreground">{item.label}:</span>
              <span className="text-muted-foreground">{item.value}</span>
            </div>
          ))}

          {/* Missing fields */}
          {uniqueMissingItems.map((item, idx) => (
            <div key={`missing-${idx}`} className="flex items-start gap-2 text-sm">
              <Icons.alertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <span className="font-medium text-foreground">{item.label}:</span>
              <span className="text-warning">{item.value || 'No especificado'}</span>
            </div>
          ))}
        </div>

        {/* Missing required warning */}
        {missingRequired.length > 0 && (
          <div className="rounded-md bg-warning/10 border border-warning/30 p-3 mb-4">
            <p className="text-sm text-warning font-medium">
              Campos requeridos faltantes:{' '}
              {missingRequired.map((f) => FIELD_LABELS[f] || f).join(', ')}
            </p>
          </div>
        )}

        {/* Follow-up prompt */}
        <div className="space-y-3">
          <div className="relative ai-prompt-textarea-wrapper">
            <Textarea
              label=""
              id="aiFollowUp"
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              rows={2}
              placeholder="Agrega más información... (ej: 'paciente Juan Pérez, entrega en 5 días')"
              className="ai-prompt-textarea pb-10"
            />

            {/* Dictate button */}
            {speechSupported && (
              <Button
                type="button"
                variant={isListening ? 'danger' : 'ghost'}
                onClick={onToggleSpeechRecognition}
                disabled={isProcessing}
                size="sm"
                className="absolute bottom-2 left-2 z-10"
              >
                {isListening ? (
                  <>
                    <Icons.micOff className="h-4 w-4 mr-2" />
                    <span>Detener</span>
                  </>
                ) : (
                  <>
                    <Icons.mic className="h-4 w-4 mr-2" />
                    <span>Dictar</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onStartOver}
                disabled={isProcessing}
                className="text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Volver a empezar
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="secondary"
                onClick={handleFollowUp}
                isLoading={isProcessing}
                disabled={!followUpText.trim() || isProcessing}
                className="w-full sm:w-auto ai-prompt-button-primary"
              >
                {isProcessing ? 'Procesando...' : 'Completar con IA'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onApply}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                Aplicar al Formulario
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
