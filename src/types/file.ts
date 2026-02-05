export enum FileCategory {
  SCAN_UPPER = 'scanUpper',
  SCAN_LOWER = 'scanLower',
  SCAN_BITE = 'scanBite',
  PHOTOGRAPH = 'photograph',
  OTHER = 'other',
}

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  [FileCategory.SCAN_UPPER]: 'Escaneo Superior (STL/PLY)',
  [FileCategory.SCAN_LOWER]: 'Escaneo Inferior (STL/PLY)',
  [FileCategory.SCAN_BITE]: 'Escaneo de Mordida (STL/PLY)',
  [FileCategory.PHOTOGRAPH]: 'Fotografía',
  [FileCategory.OTHER]: 'Otro',
};

export const ALLOWED_SCAN_TYPES = ['.stl', '.ply'];
export const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];
export const ALLOWED_OTHER_TYPES = ['.pdf', '.doc', '.docx', '.txt'];
export const MAX_FILE_SIZE_MB = 50; // STL/PLY files
export const MAX_IMAGE_SIZE_MB = 10; // Images
export const MAX_OTHER_SIZE_MB = 20; // Other files
export const MAX_FILES_PER_CATEGORY = 3; // Maximum 3 files per category

// Scan category type for drag and drop
export type ScanCategory = 'upper' | 'lower' | 'bite';

// Labels for scan categories (Spanish)
export const SCAN_CATEGORY_LABELS: Record<ScanCategory, string> = {
  upper: 'Arcada Superior',
  lower: 'Arcada Inferior',
  bite: 'Mordida',
};

/**
 * Detect scan category from filename based on common naming patterns.
 * Returns null if no pattern matches.
 */
export function detectScanCategoryFromFilename(filename: string): ScanCategory | null {
  const lower = filename.toLowerCase();

  // Upper arch patterns
  if (/_upper|_sup|_maxilar|_superior|upper_|sup_|maxilar_/.test(lower)) {
    return 'upper';
  }

  // Lower arch patterns
  if (/_lower|_inf|_mandibular|_inferior|lower_|inf_|mandibular_/.test(lower)) {
    return 'lower';
  }

  // Bite patterns
  if (/_bite|_mordida|_oclusion|_occlusion|bite_|mordida_|oclusion_/.test(lower)) {
    return 'bite';
  }

  return null;
}
