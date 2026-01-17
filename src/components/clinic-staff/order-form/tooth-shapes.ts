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
 * Designed for 24-30px width, 32px height
 */
export const TOOTH_SHAPES: Record<ToothType, ToothShape> = {
  // Central and lateral incisors (positions 1-2)
  // Rectangular with rounded top edge
  incisor: {
    path: 'M 2,32 L 2,8 Q 2,2 8,2 L 16,2 Q 22,2 22,8 L 22,32 Z',
    width: 24,
    height: 32,
  },

  // Canine/cuspid (position 3)
  // Triangular pointed top (single cusp)
  canine: {
    path: 'M 2,32 L 2,12 L 12,2 L 22,12 L 22,32 Z',
    width: 24,
    height: 32,
  },

  // Premolars/bicuspids (positions 4-5)
  // Two cusps at top
  premolar: {
    path: 'M 2,32 L 2,12 L 6,8 L 12,12 L 18,8 L 22,12 L 22,32 Z',
    width: 24,
    height: 32,
  },

  // Molars (positions 6-8)
  // Three or four cusps, wider base
  molar: {
    path: 'M 2,32 L 2,14 L 6,10 L 12,14 L 18,10 L 24,14 L 28,10 L 28,32 Z',
    width: 30,
    height: 32,
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
