import { DetailRow, SectionTitle } from './ReviewSectionComponents';
import { Textarea } from '@/components/ui/Textarea';
import { Icons } from '@/components/ui/Icons';

interface DescriptionNotesSectionProps {
  description?: string;
  notes?: string;
  isUrgent?: boolean;
  // Optional edit handlers
  onDescriptionChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
  errors?: {
    description?: string;
    notes?: string;
  };
}

export function DescriptionNotesSection({
  description,
  notes,
  isUrgent,
  onDescriptionChange,
  onNotesChange,
  errors,
}: DescriptionNotesSectionProps) {
  // Show section if there's content OR if it's editable OR if urgent
  const isEditable = !!(onDescriptionChange || onNotesChange);
  if (!description && !notes && !isUrgent && !isEditable) return null;

  return (
    <>
      <SectionTitle>Descripción y Notas</SectionTitle>
      <div className="space-y-3">
        {/* Description - Editable if handler provided */}
        {onDescriptionChange ? (
          <Textarea
            label="Descripción"
            value={description || ''}
            onChange={(e) => onDescriptionChange(e.target.value)}
            error={errors?.description}
            placeholder="Describe los detalles de la orden (opcional)"
            rows={3}
          />
        ) : (
          description && <DetailRow label="Descripción" value={description} />
        )}

        {/* Notes - Editable if handler provided */}
        {onNotesChange ? (
          <Textarea
            label="Notas Adicionales"
            value={notes || ''}
            onChange={(e) => onNotesChange(e.target.value)}
            error={errors?.notes}
            placeholder="Notas adicionales para el laboratorio (opcional)"
            rows={3}
          />
        ) : (
          notes && <DetailRow label="Notas Adicionales" value={notes} />
        )}

        {/* Urgent indicator in review modal */}
        {isUrgent && (
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 mt-3">
            <div className="flex items-center gap-2">
              <Icons.zap className="h-4 w-4 text-warning" />
              <span className="font-semibold text-warning">Orden Urgente (+30%)</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
