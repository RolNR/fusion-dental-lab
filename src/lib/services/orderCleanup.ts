import { prisma } from '@/lib/prisma';
import { batchDeleteFiles } from '@/lib/r2-batch';
import { COMPLETED_ORDER_RETENTION_DAYS } from '@/lib/constants';

export interface CleanupOptions {
  /** Override default retention days */
  retentionDays?: number;
  /** Maximum orders to process in one run */
  batchSize?: number;
  /** Dry run mode - don't actually delete anything */
  dryRun?: boolean;
}

export interface CleanupResult {
  ordersProcessed: number;
  ordersDeleted: number;
  filesDeleted: number;
  filesFailed: number;
  errors: string[];
  dryRun: boolean;
}

/**
 * Extract storage key from thumbnail URL
 * Thumbnail URLs are typically in format: https://domain.r2.dev/orders/xxx/thumbnails/xxx.jpg
 */
function extractThumbnailStorageKey(thumbnailUrl: string | null): string | null {
  if (!thumbnailUrl) return null;

  try {
    const url = new URL(thumbnailUrl);
    // Remove leading slash and return the path
    return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  } catch {
    // If URL parsing fails, try to extract path directly
    const match = thumbnailUrl.match(/orders\/[^?]+/);
    return match ? match[0] : null;
  }
}

/**
 * Clean up completed orders older than the retention period.
 * - Deletes files from R2 storage
 * - Soft-deletes orders by setting deletedAt timestamp
 */
export async function cleanupCompletedOrders(options: CleanupOptions = {}): Promise<CleanupResult> {
  const {
    retentionDays = COMPLETED_ORDER_RETENTION_DAYS,
    batchSize = 100,
    dryRun = false,
  } = options;

  const result: CleanupResult = {
    ordersProcessed: 0,
    ordersDeleted: 0,
    filesDeleted: 0,
    filesFailed: 0,
    errors: [],
    dryRun,
  };

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Find completed orders older than retention period that haven't been deleted
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          lt: cutoffDate,
        },
        deletedAt: null,
      },
      include: {
        files: {
          select: {
            id: true,
            storageKey: true,
            thumbnailUrl: true,
          },
        },
      },
      take: batchSize,
      orderBy: {
        completedAt: 'asc', // Process oldest first
      },
    });

    result.ordersProcessed = orders.length;

    if (orders.length === 0) {
      return result;
    }

    // Process each order
    for (const order of orders) {
      try {
        // Collect all storage keys for this order (files + thumbnails)
        const storageKeys: string[] = [];

        for (const file of order.files) {
          // Add main file storage key
          if (file.storageKey) {
            storageKeys.push(file.storageKey);
          }

          // Add thumbnail storage key if it exists
          const thumbnailKey = extractThumbnailStorageKey(file.thumbnailUrl);
          if (thumbnailKey) {
            storageKeys.push(thumbnailKey);
          }
        }

        if (dryRun) {
          // In dry run mode, just log what would happen
          console.log(`[DRY RUN] Would delete order ${order.id} with ${storageKeys.length} files`);
          result.ordersDeleted++;
          result.filesDeleted += storageKeys.length;
          continue;
        }

        // Delete files from R2
        if (storageKeys.length > 0) {
          const deleteResult = await batchDeleteFiles(storageKeys);
          result.filesDeleted += deleteResult.deleted.length;
          result.filesFailed += deleteResult.failed.length;

          // Log any file deletion failures (but continue with soft-delete)
          for (const failed of deleteResult.failed) {
            result.errors.push(`Failed to delete file ${failed.key}: ${failed.error}`);
          }
        }

        // Soft-delete the order
        await prisma.order.update({
          where: { id: order.id },
          data: { deletedAt: new Date() },
        });

        result.ordersDeleted++;
      } catch (orderError) {
        const errorMessage = orderError instanceof Error ? orderError.message : 'Unknown error';
        result.errors.push(`Failed to process order ${order.id}: ${errorMessage}`);
      }
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Cleanup failed: ${errorMessage}`);
    return result;
  }
}
