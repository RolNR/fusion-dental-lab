/**
 * AI Suggestions Types
 *
 * Types for the AI suggestions feature that recommends additional fields
 * based on partial user input in the order form.
 */

export interface AISuggestion {
  /** Field path to update (e.g., "shadeType", "escanerUtilizado") */
  field: string;

  /** Suggested value (string, enum, boolean, number) */
  value: unknown;

  /** Human-readable field name for UI display */
  label: string;

  /** Explanation for why this field is suggested */
  reason: string;

  /** Confidence score (0-100) */
  confidence: number;

  /** Scope of the suggestion */
  category: 'order' | 'tooth';

  /** Tooth number if category is 'tooth' (FDI notation: 11-48) */
  toothNumber?: string;
}

export interface ParseAIPromptResponse {
  success: true;
  data: {
    /** Explicitly confirmed values from the AI prompt */
    confirmedValues: Record<string, unknown>;

    /** Intelligent suggestions based on context */
    suggestions: AISuggestion[];
  };
}
