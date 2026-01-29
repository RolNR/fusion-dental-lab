import { NextRequest, NextResponse } from 'next/server';
import { cleanupCompletedOrders } from '@/lib/services/orderCleanup';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Validates the cron secret from the request.
 * Vercel Cron sends the secret in the Authorization header.
 */
function validateCronSecret(request: NextRequest): boolean {
  if (!CRON_SECRET) {
    console.error('CRON_SECRET is not configured');
    return false;
  }

  // Check Authorization header (Vercel Cron format)
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token === CRON_SECRET) {
      return true;
    }
  }

  // Also check x-cron-secret header (alternative format)
  const cronSecretHeader = request.headers.get('x-cron-secret');
  if (cronSecretHeader === CRON_SECRET) {
    return true;
  }

  return false;
}

/**
 * POST/GET /api/cron/cleanup-orders
 *
 * Triggered by Vercel Cron to clean up completed orders older than retention period.
 *
 * Query params:
 * - dryRun: "true" to preview what would be deleted without actually deleting
 * - batchSize: number of orders to process (default: 100)
 */
export async function GET(request: NextRequest) {
  return handleCleanup(request);
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}

async function handleCleanup(request: NextRequest) {
  // Validate cron secret
  if (!validateCronSecret(request)) {
    console.warn('Unauthorized cron request attempt');
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';
    const batchSizeParam = searchParams.get('batchSize');
    const batchSize = batchSizeParam ? parseInt(batchSizeParam, 10) : undefined;

    // Validate batchSize if provided
    if (batchSize !== undefined && (isNaN(batchSize) || batchSize < 1 || batchSize > 500)) {
      return NextResponse.json(
        { error: 'batchSize debe ser un número entre 1 y 500' },
        { status: 400 }
      );
    }

    console.log(`Starting order cleanup: dryRun=${dryRun}, batchSize=${batchSize || 'default'}`);

    // Run cleanup
    const result = await cleanupCompletedOrders({
      dryRun,
      batchSize,
    });

    console.log('Cleanup result:', result);

    // Return summary
    return NextResponse.json(
      {
        success: true,
        summary: {
          ordersProcessed: result.ordersProcessed,
          ordersDeleted: result.ordersDeleted,
          filesDeleted: result.filesDeleted,
          filesFailed: result.filesFailed,
          dryRun: result.dryRun,
        },
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error durante la limpieza de órdenes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
