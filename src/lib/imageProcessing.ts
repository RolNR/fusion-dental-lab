import sharp from 'sharp';
import { uploadBuffer } from './r2';

const THUMBNAIL_WIDTH = 800;
const THUMBNAIL_QUALITY = 85;
export const THUMBNAIL_SUFFIX = '-thumb.webp';

/**
 * Process image: convert to WebP and create thumbnail
 *
 * @param imageBuffer - Original image buffer
 * @param storageKey - Original file storage key
 * @returns Thumbnail storage key
 */
export async function processImage(imageBuffer: Buffer, storageKey: string): Promise<string> {
  // Convert to WebP
  const webpBuffer = await sharp(imageBuffer)
    .webp({ quality: THUMBNAIL_QUALITY })
    .resize(THUMBNAIL_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .toBuffer();

  // Generate thumbnail storage key
  const thumbnailKey = storageKey.replace(/\.[^.]+$/, THUMBNAIL_SUFFIX);

  // Upload thumbnail to R2
  await uploadBuffer(thumbnailKey, webpBuffer, 'image/webp');

  return thumbnailKey;
}

/**
 * Check if file type requires image processing
 */
export function requiresProcessing(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
