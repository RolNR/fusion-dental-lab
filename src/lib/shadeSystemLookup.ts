import type { ShadeSystemValue } from '@/types/order';

/**
 * Known shade codes per colorimeter system.
 * Used to auto-infer the shade system from a given code.
 */
const VITAPAN_CLASSICAL_CODES = new Set([
  'A1',
  'A2',
  'A3',
  'A3.5',
  'A4',
  'B1',
  'B2',
  'B3',
  'B4',
  'C1',
  'C2',
  'C3',
  'C4',
  'D2',
  'D3',
  'D4',
]);

// VITAPAN 3D-Master codes: pattern like 0M1, 1M2, 2L1.5, 2M1, 2R1.5, etc.
const VITAPAN_3D_MASTER_REGEX = /^[0-5][LMR]\d(\.\d)?$/i;

// Chromascop codes: 3-digit numbers in groups (110-540)
const CHROMASCOP_REGEX = /^[1-5][1-4]0$/;

// Bleach codes: BL1-BL4
const BLEACH_REGEX = /^BL[1-4]$/i;

/**
 * Infers the shade system from a given shade code.
 * Returns the system value or null if no match is found.
 */
export function inferShadeSystem(code: string): ShadeSystemValue | null {
  if (!code) return null;

  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  // Check VITAPAN Classical (exact match)
  if (VITAPAN_CLASSICAL_CODES.has(normalized)) {
    return 'VITAPAN_CLASSICAL';
  }

  // Check VITAPAN 3D-Master (pattern match)
  if (VITAPAN_3D_MASTER_REGEX.test(normalized)) {
    return 'VITAPAN_3D_MASTER';
  }

  // Check Chromascop (3-digit group match)
  if (CHROMASCOP_REGEX.test(normalized)) {
    return 'IVOCLAR_CHROMASCOP';
  }

  // Check Bleach (BL1-BL4)
  if (BLEACH_REGEX.test(normalized)) {
    return 'IVOCLAR_AD_BLEACH';
  }

  return null;
}
