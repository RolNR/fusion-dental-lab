import { SectionTitle } from './ReviewSectionComponents';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import type { AISuggestion } from '@/types/ai-suggestions';

interface AISuggestionsSectionProps {
  suggestions: AISuggestion[];
  onApplySuggestion: (suggestion: AISuggestion) => void;
}

export function AISuggestionsSection({
  suggestions,
  onApplySuggestion,
}: AISuggestionsSectionProps) {
  // Filter high-confidence suggestions (>= 80%)
  // Keep reminders (field starts with _) regardless of confidence
  // Limit to top 8 to accommodate required field reminders
  const qualitySuggestions = suggestions
    .filter((s) => s.confidence >= 80 || s.field.startsWith('_'))
    .slice(0, 8);

  if (qualitySuggestions.length === 0) return null;

  return (
    <>
      <SectionTitle>Sugerencias de IA</SectionTitle>

      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
        <div className="flex items-start gap-2 mb-3">
          <Icons.lightbulb className="h-5 w-5 text-primary mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Basándose en tu descripción, la IA sugiere estos campos adicionales:
          </p>
        </div>

        <div className="space-y-3">
          {qualitySuggestions.map((suggestion, index) => (
            <SuggestionCard
              key={index}
              suggestion={suggestion}
              onApply={() => onApplySuggestion(suggestion)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

interface SuggestionCardProps {
  suggestion: AISuggestion;
  onApply: () => void;
}

function SuggestionCard({ suggestion, onApply }: SuggestionCardProps) {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (value && typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Check if this is a special reminder (starts with underscore)
  const isReminder = suggestion.field.startsWith('_');
  const isRequiredField = suggestion.value === null;

  return (
    <div className="flex items-start gap-3 rounded-lg bg-background border border-border p-3">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground text-sm">{suggestion.label}</span>
          {suggestion.toothNumber && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              Diente {suggestion.toothNumber}
            </span>
          )}
          {!isReminder && (
            <span className="text-xs text-muted-foreground">
              {suggestion.confidence}% confianza
            </span>
          )}
          {isReminder && (
            <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded font-medium">
              Recordatorio
            </span>
          )}
          {isRequiredField && (
            <span className="text-xs bg-danger/20 text-danger px-2 py-0.5 rounded font-medium">
              Requerido
            </span>
          )}
        </div>

        {formatValue(suggestion.value) && (
          <p className="text-sm text-primary font-medium">{formatValue(suggestion.value)}</p>
        )}

        <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
      </div>

      {/* Only show "Aplicar" button if it's not a reminder and has a value */}
      {!isReminder && suggestion.value !== null && (
        <Button type="button" variant="secondary" size="sm" onClick={onApply} className="shrink-0">
          Aplicar
        </Button>
      )}
    </div>
  );
}
