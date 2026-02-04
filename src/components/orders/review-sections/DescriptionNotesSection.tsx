import { DetailRow, SectionTitle } from './ReviewSectionComponents';
import { Textarea } from '@/components/ui/Textarea';

interface DescriptionNotesSectionProps {
  notes?: string;
  // Optional edit handler
  onNotesChange?: (value: string) => void;
  errors?: {
    notes?: string;
  };
}

export function DescriptionNotesSection({
  notes,
  onNotesChange,
  errors,
}: DescriptionNotesSectionProps) {
  // Show section if there's content OR if it's editable
  const isEditable = !!onNotesChange;
  if (!notes && !isEditable) return null;

  return (
    <>
      <SectionTitle>Notas Adicionales</SectionTitle>
      <div className="space-y-3">
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
