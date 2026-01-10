import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * Generate a unique storage key for a file
 * Format: orders/{orderId}/{category}/{timestamp}-{random}.{ext}
 */
export function generateStorageKey(
  orderId: string,
  category: string,
  originalName: string
): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || '';
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `orders/${orderId}/${category}/${timestamp}-${random}.${ext}`;
}

/**
 * Generate pre-signed upload URL for direct client → R2 upload
 *
 * @param storageKey - Unique file key in R2
 * @param contentType - MIME type
 * @param expiresIn - URL expiration in seconds (default: 5 minutes)
 */
export async function generateUploadUrl(
  storageKey: string,
  contentType: string,
  expiresIn: number = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
    ContentType: contentType,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate pre-signed download URL
 *
 * @param storageKey - File key in R2
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 */
export async function generateDownloadUrl(
  storageKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete file from R2
 */
export async function deleteFile(storageKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  });

  await r2Client.send(command);
}

/**
 * Get public URL for a file (if bucket has public access)
 */
export function getPublicUrl(storageKey: string): string {
  return `${PUBLIC_URL}/${storageKey}`;
}

/**
 * Upload buffer directly to R2 (used for processed images)
 */
export async function uploadBuffer(
  storageKey: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);
}
