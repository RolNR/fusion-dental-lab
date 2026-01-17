import { SectionTitle } from './ReviewSectionComponents';
import { Checkbox } from '@/components/ui/Checkbox';
import { Icons } from '@/components/ui/Icons';
import { formatNonWarrantyMaterialsText } from '@/lib/materialWarrantyUtils';

interface WarrantyDisclaimerSectionProps {
  materialSent?: Record<string, boolean>;
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

export function WarrantyDisclaimerSection({
  materialSent,
  accepted,
  onAcceptChange,
}: WarrantyDisclaimerSectionProps) {
  const materialsText = formatNonWarrantyMaterialsText(materialSent);

  if (!materialsText) {
    return null;
  }

  return (
    <>
      <SectionTitle>Aceptación de Garantía</SectionTitle>

      <div className="rounded-lg bg-warning/10 border-2 border-warning/30 p-4">
        <div className="flex items-start gap-3 mb-4">
          <Icons.alertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Material sin garantía
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              El siguiente material no cuenta con garantía de resultados:
            </p>
            <p className="text-sm font-medium text-foreground mt-2">
              {materialsText}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-warning/20">
          <Checkbox
            label={
              <span className="text-sm font-medium text-foreground">
                Acepto que al mandar este tipo de material no aplica garantía
              </span>
            }
            checked={accepted}
            onChange={(e) => onAcceptChange(e.target.checked)}
            required
          />
        </div>
      </div>
    </>
  );
}
