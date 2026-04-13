/**
 * Utility functions for checking material warranty status
 */

// Materials that don't have warranty guarantee.
// Rule (!): applies to Aluminio, Modelo corrido, Impresión parcial (within
// "De trabajo"), and "En cera" selections — at any level in the tree.
const NO_WARRANTY_MATERIALS = [
  // Aluminio (any category)
  'de_trabajo_arcada_completa_aluminio',
  'de_trabajo_parcial_aluminio',
  // Modelo corrido
  'de_trabajo_modelo_corrido',
  // Impresión parcial (within "De trabajo") — all sub-materials
  'de_trabajo_parcial_metalica_rigida',
  'de_trabajo_parcial_plastica_rigida',
  'de_trabajo_parcial_personalizada',
  // En cera
  'registro_total_cera',
  'registro_parcial_cera',
];

// Material labels for display
const MATERIAL_LABELS: Record<string, string> = {
  de_trabajo_arcada_completa_aluminio: 'De trabajo - Arcada completa - Aluminio',
  de_trabajo_parcial_metalica_rigida: 'De trabajo - Impresión parcial - Metálica rígida',
  de_trabajo_parcial_plastica_rigida: 'De trabajo - Impresión parcial - Plástica rígida',
  de_trabajo_parcial_aluminio: 'De trabajo - Impresión parcial - Aluminio',
  de_trabajo_parcial_personalizada: 'De trabajo - Impresión parcial - Personalizada',
  de_trabajo_modelo_corrido: 'De trabajo - Modelo corrido',
  registro_total_cera: 'Registro oclusal - Registro total - En cera',
  registro_parcial_cera: 'Registro oclusal - Registro parcial - En cera',
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
