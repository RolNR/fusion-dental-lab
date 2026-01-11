/**
 * Get MIME type for file, with fallback for STL/PLY files
 */
export function getFileMimeType(file: File): string {
  if (file.type) {
    return file.type;
  }

  // Fallback based on file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'stl') {
    return 'model/stl';
  }
  if (extension === 'ply') {
    return 'application/ply';
  }

  // Default fallback
  return 'application/octet-stream';
}
