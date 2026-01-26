/**
 * SVG path definitions for different tooth types
 * Simplified anatomical shapes for visual odontogram
 */

export type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar';

export interface ToothShape {
  path: string;
  width: number;
  height: number;
}

/**
 * Simplified anatomical tooth shapes
 * Designed for 34-42px width, 44px height (larger for better clickability)
 */
export const TOOTH_SHAPES: Record<ToothType, ToothShape> = {
  // Central and lateral incisors (positions 1-2)
  // Rectangular with rounded top edge
  incisor: {
    path: 'M 2,44 L 2,11 Q 2,3 11,3 L 23,3 Q 32,3 32,11 L 32,44 Z',
    width: 34,
    height: 44,
  },

  // Canine/cuspid (position 3)
  // Triangular pointed top (single cusp)
  canine: {
    path: 'M 3,44 L 3,17 L 17,3 L 31,17 L 31,44 Z',
    width: 34,
    height: 44,
  },

  // Premolars/bicuspids (positions 4-5)
  // Two cusps at top
  premolar: {
    path: 'M 3,44 L 3,17 L 9,11 L 17,17 L 26,11 L 31,17 L 31,44 Z',
    width: 34,
    height: 44,
  },

  // Molars (positions 6-8)
  // Three or four cusps, wider base
  molar: {
    path: 'M 3,44 L 3,19 L 8,14 L 17,19 L 25,14 L 34,19 L 39,14 L 39,44 Z',
    width: 42,
    height: 44,
  },
};

/**
 * Maps FDI tooth position (1-8) to tooth type
 * Position 1-2: Incisors
 * Position 3: Canine
 * Position 4-5: Premolars
 * Position 6-8: Molars
 */
export function getToothType(position: number): ToothType {
  if (position <= 2) return 'incisor';
  if (position === 3) return 'canine';
  if (position === 4 || position === 5) return 'premolar';
  return 'molar'; // positions 6, 7, 8
}

/**
 * Extracts position from FDI tooth number
 * E.g., 11 → 1, 18 → 8, 21 → 1, 48 → 8
 */
export function getToothPosition(toothNumber: string): number {
  const num = parseInt(toothNumber, 10);
  return num % 10;
}

/**
 * Gets tooth type from FDI tooth number
 * E.g., "11" → 'incisor', "13" → 'canine', "16" → 'molar'
 */
export function getToothTypeFromNumber(toothNumber: string): ToothType {
  const position = getToothPosition(toothNumber);
  return getToothType(position);
}

/**
 * Returns human-readable tooth name in Spanish
 */
export function getToothName(toothNumber: string): string {
  const type = getToothTypeFromNumber(toothNumber);
  const names: Record<ToothType, string> = {
    incisor: 'incisivo',
    canine: 'canino',
    premolar: 'premolar',
    molar: 'molar',
  };
  return names[type];
}
