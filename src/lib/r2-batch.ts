import { S3Client, DeleteObjectsCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

export interface BatchDeleteResult {
  deleted: string[];
  failed: { key: string; error: string }[];
}

/**
 * Delete multiple files from R2 in a single batch operation.
 * AWS S3 allows up to 1000 objects per DeleteObjects call.
 *
 * @param storageKeys - Array of storage keys to delete
 * @returns Result with deleted keys and any failures
 */
export async function batchDeleteFiles(storageKeys: string[]): Promise<BatchDeleteResult> {
  if (storageKeys.length === 0) {
    return { deleted: [], failed: [] };
  }

  const result: BatchDeleteResult = {
    deleted: [],
    failed: [],
  };

  // Process in chunks of 1000 (S3/R2 limit)
  const chunkSize = 1000;
  for (let i = 0; i < storageKeys.length; i += chunkSize) {
    const chunk = storageKeys.slice(i, i + chunkSize);

    try {
      const command = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
          Quiet: false, // Get detailed response
        },
      });

      const response = await r2Client.send(command);

      // Track successful deletions
      if (response.Deleted) {
        for (const deleted of response.Deleted) {
          if (deleted.Key) {
            result.deleted.push(deleted.Key);
          }
        }
      }

      // Track failed deletions
      if (response.Errors) {
        for (const error of response.Errors) {
          if (error.Key) {
            result.failed.push({
              key: error.Key,
              error: error.Message || 'Unknown error',
            });
          }
        }
      }
    } catch (error) {
      // If batch delete fails completely, fall back to individual deletion
      console.error('Batch delete failed, falling back to individual deletion:', error);

      for (const key of chunk) {
        try {
          await r2Client.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: key,
            })
          );
          result.deleted.push(key);
        } catch (individualError) {
          result.failed.push({
            key,
            error: individualError instanceof Error ? individualError.message : 'Unknown error',
          });
        }
      }
    }
  }

  return result;
}
