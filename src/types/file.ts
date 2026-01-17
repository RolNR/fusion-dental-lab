export enum FileCategory {
  SCAN_UPPER = 'scanUpper',
  SCAN_LOWER = 'scanLower',
  MOUTH_PHOTO = 'mouthPhoto',
  OTHER = 'other',
}

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  [FileCategory.SCAN_UPPER]: 'Escaneo Superior',
  [FileCategory.SCAN_LOWER]: 'Escaneo Inferior',
  [FileCategory.MOUTH_PHOTO]: 'Foto Intraoral',
  [FileCategory.OTHER]: 'Otro',
};

export const ALLOWED_SCAN_TYPES = ['.stl', '.ply'];
export const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_FILE_SIZE_MB = 50; // STL/PLY files
export const MAX_IMAGE_SIZE_MB = 10; // Images
