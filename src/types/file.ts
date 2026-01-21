export enum FileCategory {
  SCAN_UPPER = 'scanUpper',
  SCAN_LOWER = 'scanLower',
  PHOTOGRAPH = 'photograph',
  OTHER = 'other',
}

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  [FileCategory.SCAN_UPPER]: 'Escaneo Superior (STL/PLY)',
  [FileCategory.SCAN_LOWER]: 'Escaneo Inferior (STL/PLY)',
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
