import { SectionTitle } from './ReviewSectionComponents';

interface AIPromptSectionProps {
  aiPrompt?: string;
}

export function AIPromptSection({ aiPrompt }: AIPromptSectionProps) {
  if (!aiPrompt) return null;

  return (
    <>
      <SectionTitle>Prompt de IA</SectionTitle>
      <div className="rounded-lg bg-muted/30 p-4">
        <p className="text-sm text-foreground whitespace-pre-wrap">{aiPrompt}</p>
      </div>
    </>
  );
}
