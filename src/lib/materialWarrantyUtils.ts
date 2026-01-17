/**
 * Utility functions for checking material warranty status
 */

// Materials that don't have warranty guarantee
const NO_WARRANTY_MATERIALS = [
  'arcada_completa_aluminio',
  'parcial_aluminio',
  'cucharilla_doble',
  'registro_cera',
];

// Material labels for display
const MATERIAL_LABELS: Record<string, string> = {
  arcada_completa_aluminio: 'Arcada completa - Aluminio',
  parcial_aluminio: 'Parcial - Aluminio',
  cucharilla_doble: 'Cucharilla doble',
  registro_cera: 'Registro - Cera',
};

/**
 * Check if the selected materials include any non-warranty items
 */
export function hasNonWarrantyMaterials(materialSent?: Record<string, boolean>): boolean {
  if (!materialSent) return false;

  return Object.keys(materialSent).some(
    (key) => materialSent[key] && NO_WARRANTY_MATERIALS.includes(key)
  );
}

/**
 * Get list of selected non-warranty materials with their labels
 */
export function getNonWarrantyMaterialLabels(materialSent?: Record<string, boolean>): string[] {
  if (!materialSent) return [];

  return Object.keys(materialSent)
    .filter((key) => materialSent[key] && NO_WARRANTY_MATERIALS.includes(key))
    .map((key) => MATERIAL_LABELS[key] || key);
}

/**
 * Format non-warranty materials for display in disclaimer text
 */
export function formatNonWarrantyMaterialsText(materialSent?: Record<string, boolean>): string {
  const materials = getNonWarrantyMaterialLabels(materialSent);

  if (materials.length === 0) return '';
  if (materials.length === 1) return materials[0];
  if (materials.length === 2) return materials.join(' y ');

  // For 3+ items: "A, B y C"
  const lastMaterial = materials[materials.length - 1];
  const otherMaterials = materials.slice(0, -1).join(', ');
  return `${otherMaterials} y ${lastMaterial}`;
}
