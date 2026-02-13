import type { RestorationType } from '@prisma/client';

/**
 * Materials available per restoration type.
 * Based on the laboratory's material catalog.
 */
const MATERIALS_MAP: Partial<Record<RestorationType, string[]>> = {
  carilla: ['Refractario feldespático', 'e.max® estratificada'],
  corona: [
    'Zirconio estratificado',
    'Zirconio monolítico',
    'Zirconio monolítico con frente cerámico',
    'e.max® estratificada',
    'e.max® monolítica',
    'Metalcerámico anterior',
    'Metalcerámico posterior',
    'Prototipo PMMA CAD/CAM',
    'Prototipo PMMA de larga duración CAD/CAM',
    'Prototipo PMMA calcinable',
    'Prototipo en resina impresa',
  ],
  incrustacion: ['Metalcerámico', 'e.max®'],
  maryland: ['Zirconio', 'e.max®', 'Metalcerámico'],
  puente: [
    'Zirconio estratificado',
    'Zirconio monolítico',
    'Zirconio monolítico con frente cerámico',
    'Metalcerámico',
  ],
};

/**
 * Returns available materials for a given restoration type.
 * Returns an empty array if no materials are defined for the type.
 */
export function getMaterialsForRestoration(
  restorationType: RestorationType | undefined | null
): string[] {
  if (!restorationType) return [];
  return MATERIALS_MAP[restorationType] ?? [];
}

/**
 * Returns the union of materials for multiple restoration types (deduped, sorted).
 * Useful for bulk config when applying across multiple restoration types.
 */
export function getMaterialsForRestorationTypes(types: RestorationType[]): string[] {
  const all = new Set<string>();
  for (const type of types) {
    for (const m of MATERIALS_MAP[type] ?? []) {
      all.add(m);
    }
  }
  return Array.from(all).sort((a, b) => a.localeCompare(b, 'es'));
}
