import { DetailRow, SectionTitle } from './ReviewSectionComponents';
import { Textarea } from '@/components/ui/Textarea';

interface DescriptionNotesSectionProps {
  description?: string;
  notes?: string;
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
  onDescriptionChange,
  onNotesChange,
  errors,
}: DescriptionNotesSectionProps) {
  // Show section if there's content OR if it's editable
  const isEditable = !!(onDescriptionChange || onNotesChange);
  if (!description && !notes && !isEditable) return null;

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
      </div>
    </>
  );
}
